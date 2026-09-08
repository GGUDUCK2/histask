import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearTestDatabases,
  createTestDatabase,
} from '@/test/database'
import { cardFixture, workLogFixture } from '@/test/domain-fixtures'
import { localDayRange } from '@/utils/dates'
import {
  DashboardService,
  millisecondsUntilNextLocalDay,
} from './dashboard'

afterEach(async () => {
  await clearTestDatabases()
})

function timestampInside(day: Date, hoursAfterStart = 1): string {
  const { start } = localDayRange(day)
  return new Date(Date.parse(start) + hoursAfterStart * 3_600_000).toISOString()
}

describe('DashboardService', () => {
  it('calculates all five metrics and counts unique updated Cards', async () => {
    const database = await createTestDatabase('dashboard-metrics')
    const day = new Date(2026, 8, 8, 12)
    const today = timestampInside(day)
    const yesterday = new Date(Date.parse(today) - 86_400_000).toISOString()
    await database.cards.bulkAdd([
      cardFixture({ id: 'todo', status: 'TODO' }),
      cardFixture({ id: 'progress', status: 'IN_PROGRESS' }),
      cardFixture({ id: 'waiting', status: 'WAITING' }),
      cardFixture({ id: 'done', status: 'DONE' }),
      cardFixture({
        id: 'archived',
        status: 'DONE',
        archivedAt: today,
      }),
    ])
    await database.workLogs.bulkAdd([
      workLogFixture({ id: 'log-1', cardId: 'todo', createdAt: today }),
      workLogFixture({ id: 'log-2', cardId: 'todo', createdAt: today }),
      workLogFixture({ id: 'log-3', cardId: 'waiting', createdAt: yesterday }),
      workLogFixture({ id: 'log-4', cardId: 'archived', createdAt: today }),
    ])

    await expect(new DashboardService(database).getMetrics(day)).resolves.toEqual(
      {
        total: 4,
        inProgress: 1,
        waiting: 1,
        done: 1,
        updatedToday: 1,
      },
    )
  })

  it('reacts to status, archive, and WorkLog changes', async () => {
    const database = await createTestDatabase('dashboard-reactive')
    const day = new Date(2026, 8, 8, 12)
    const service = new DashboardService(database, { clock: () => day })
    await database.cards.add(cardFixture({ id: 'card-1' }))
    const snapshots: number[][] = []
    let resolveInitial: (() => void) | undefined
    let resolveLog: (() => void) | undefined
    let resolveDone: (() => void) | undefined
    let resolveArchived: (() => void) | undefined
    const initial = new Promise<void>((resolve) => {
      resolveInitial = resolve
    })
    const withLog = new Promise<void>((resolve) => {
      resolveLog = resolve
    })
    const done = new Promise<void>((resolve) => {
      resolveDone = resolve
    })
    const archived = new Promise<void>((resolve) => {
      resolveArchived = resolve
    })
    const unsubscribe = service.observeMetrics().subscribe(
      (metrics) => {
        snapshots.push([
          metrics.total,
          metrics.done,
          metrics.updatedToday,
        ])
        if (snapshots.length === 1) resolveInitial?.()
        if (snapshots.length === 2) resolveLog?.()
        if (snapshots.length === 3) resolveDone?.()
        if (snapshots.length === 4) resolveArchived?.()
      },
      () => undefined,
    )

    await initial
    await database.workLogs.add(
      workLogFixture({
        id: 'log-1',
        cardId: 'card-1',
        createdAt: timestampInside(day),
      }),
    )
    await withLog
    await database.cards.update('card-1', { status: 'DONE' })
    await done
    await database.cards.update('card-1', {
      archivedAt: timestampInside(day),
    })
    await archived
    unsubscribe()

    expect(snapshots).toEqual([
      [1, 0, 0],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ])
  })

  it('drops deleted Cards and deleted WorkLogs from metrics', async () => {
    const database = await createTestDatabase('dashboard-delete')
    const day = new Date(2026, 8, 8, 12)
    const service = new DashboardService(database)
    await database.cards.bulkAdd([
      cardFixture({ id: 'card-1' }),
      cardFixture({ id: 'card-2', status: 'WAITING' }),
    ])
    await database.workLogs.bulkAdd([
      workLogFixture({
        id: 'log-1',
        cardId: 'card-1',
        createdAt: timestampInside(day),
      }),
      workLogFixture({
        id: 'log-2',
        cardId: 'card-2',
        createdAt: timestampInside(day),
      }),
    ])

    await database.cards.delete('card-2')
    await database.workLogs.delete('log-1')

    await expect(service.getMetrics(day)).resolves.toEqual({
      total: 1,
      inProgress: 0,
      waiting: 0,
      done: 0,
      updatedToday: 0,
    })
  })

  it('refreshes at local midnight and when the tab becomes visible', async () => {
    const beforeMidnight = new Date(2026, 8, 8, 23, 59, 59, 500)
    let currentTime = beforeMidnight
    let scheduled: (() => void) | undefined
    const listeners = new Set<EventListener>()
    const visibilitySource = {
      visibilityState: 'visible',
      addEventListener: (
        _type: 'visibilitychange',
        listener: EventListener,
      ) => listeners.add(listener),
      removeEventListener: (
        _type: 'visibilitychange',
        listener: EventListener,
      ) => listeners.delete(listener),
    }
    const database = await createTestDatabase('dashboard-midnight')
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.workLogs.add(
      workLogFixture({
        id: 'log-1',
        cardId: 'card-1',
        createdAt: timestampInside(beforeMidnight),
      }),
    )
    const service = new DashboardService(database, {
      clock: () => currentTime,
      scheduler: {
        set: (callback) => {
          scheduled = callback
          return 1
        },
        clear: () => undefined,
      },
      visibilitySource,
    })
    const updatedCounts: number[] = []
    let resolveInitial: (() => void) | undefined
    let resolveNextDay: (() => void) | undefined
    let resolveVisible: (() => void) | undefined
    const initial = new Promise<void>((resolve) => {
      resolveInitial = resolve
    })
    const nextDay = new Promise<void>((resolve) => {
      resolveNextDay = resolve
    })
    const unsubscribe = service.observeMetrics().subscribe(
      ({ updatedToday }) => {
        updatedCounts.push(updatedToday)
        if (updatedCounts.length === 1) resolveInitial?.()
        if (updatedCounts.at(-1) === 0) resolveNextDay?.()
        if (updatedCounts.at(-1) === 1 && updatedCounts.length > 2)
          resolveVisible?.()
      },
      () => undefined,
    )

    await initial
    currentTime = new Date(2026, 8, 9, 0, 0, 0)
    scheduled?.()
    await nextDay
    expect(updatedCounts[0]).toBe(1)
    expect(updatedCounts.at(-1)).toBe(0)

    const visible = new Promise<void>((resolve) => {
      resolveVisible = resolve
    })
    currentTime = beforeMidnight
    for (const listener of listeners) listener(new Event('visibilitychange'))
    await visible
    unsubscribe()
    expect(listeners.size).toBe(0)
  })

  it('uses the real local-day length across daylight-saving transitions', () => {
    const beforeNextDay = new Date(2026, 2, 7, 23, 0, 0)
    expect(millisecondsUntilNextLocalDay(beforeNextDay)).toBe(3_600_000)
  })
})
