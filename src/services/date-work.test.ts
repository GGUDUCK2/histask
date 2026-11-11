import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { cardFixture, workLogFixture } from '@/test/domain-fixtures'
import { BoardQueryService } from './board-query'
import {
  computeDateWorkSummary,
  computeMonthActivityIndicators,
  DateWorkService,
} from './date-work'

afterEach(clearTestDatabases)

describe('date-work queries and indicators', () => {
  it('groups due, unique updated cards with day logs, completed, and created for a date', async () => {
    const database = await createTestDatabase('date-work-summary')
    const service = new DateWorkService(database)
    const targetDay = new Date(2026, 8, 8, 12, 0, 0)
    const morningIso = new Date(2026, 8, 8, 9, 0, 0).toISOString()
    const eveningIso = new Date(2026, 8, 8, 21, 30, 0).toISOString()
    const prevDayLateIso = new Date(2026, 8, 7, 23, 59, 0).toISOString()

    await database.cards.bulkAdd([
      cardFixture({
        id: 'due-card',
        title: 'Submit proposal',
        dueDate: '2026-09-08',
        createdAt: prevDayLateIso,
        updatedAt: prevDayLateIso,
      }),
      cardFixture({
        id: 'multi-log-card',
        title: 'API audit',
        createdAt: prevDayLateIso,
        updatedAt: eveningIso,
      }),
      cardFixture({
        id: 'done-card',
        title: 'Deploy DNS',
        status: 'DONE',
        completedAt: morningIso,
        createdAt: prevDayLateIso,
        updatedAt: morningIso,
      }),
      cardFixture({
        id: 'created-card',
        title: 'Draft roadmap',
        createdAt: morningIso,
        updatedAt: morningIso,
      }),
      cardFixture({
        id: 'archived-card',
        title: 'Archived item',
        dueDate: '2026-09-08',
        archivedAt: eveningIso,
      }),
    ])

    await database.workLogs.bulkAdd([
      workLogFixture({
        id: 'log-1',
        cardId: 'multi-log-card',
        content: 'First check',
        createdAt: morningIso,
      }),
      workLogFixture({
        id: 'log-2',
        cardId: 'multi-log-card',
        content: 'Final verification passed',
        createdAt: eveningIso,
      }),
      workLogFixture({
        id: 'log-prev',
        cardId: 'due-card',
        content: 'Previous day update',
        createdAt: prevDayLateIso,
      }),
      workLogFixture({
        id: 'log-archived',
        cardId: 'archived-card',
        content: 'Ignored log',
        createdAt: eveningIso,
      }),
    ])

    const summary = await service.getDateWork(targetDay)
    expect(summary.dateKey).toBe('2026-09-08')
    expect(summary.due.map((p) => p.card.id)).toEqual(['due-card'])
    expect(summary.updated).toHaveLength(1)
    expect(summary.updated[0].projection.card.id).toBe('multi-log-card')
    expect(summary.updated[0].dayWorkLogs.map((l) => l.id)).toEqual([
      'log-2',
      'log-1',
    ])
    expect(summary.updated[0].latestDayWorkLog.id).toBe('log-2')
    expect(summary.completed.map((p) => p.card.id)).toEqual(['done-card'])
    expect(summary.created.map((p) => p.card.id)).toEqual(['created-card'])

    const indicators = await service.getMonthIndicators(2026, 8)
    expect(indicators.get('2026-09-08')).toEqual({
      dateKey: '2026-09-08',
      hasDue: true,
      hasCompleted: true,
      hasWorkLog: true,
    })
    expect(indicators.get('2026-09-07')).toEqual({
      dateKey: '2026-09-07',
      hasDue: false,
      hasCompleted: false,
      hasWorkLog: true,
    })
  })

  it('handles leap day indicators and midnight local boundaries accurately', async () => {
    const database = await createTestDatabase('date-work-leap')
    await database.cards.add(
      cardFixture({
        id: 'leap-card',
        dueDate: '2024-02-29',
        status: 'DONE',
        completedAt: new Date(2024, 1, 29, 23, 59, 59, 999).toISOString(),
        createdAt: new Date(2024, 1, 29, 0, 0, 0, 0).toISOString(),
        updatedAt: new Date(2024, 1, 29, 23, 59, 59, 999).toISOString(),
      }),
    )
    const snapshot = await new BoardQueryService(database).getWorkspaceSnapshot()

    const leapSummary = computeDateWorkSummary(snapshot, '2024-02-29')
    expect(leapSummary.due).toHaveLength(1)
    expect(leapSummary.completed).toHaveLength(1)
    expect(leapSummary.created).toHaveLength(1)

    const nextDay = computeDateWorkSummary(snapshot, '2024-03-01')
    expect(nextDay.due).toEqual([])
    expect(nextDay.completed).toEqual([])
    expect(nextDay.created).toEqual([])

    const leapIndicators = computeMonthActivityIndicators(snapshot, 2024, 1)
    expect(leapIndicators.get('2024-02-29')).toEqual({
      dateKey: '2024-02-29',
      hasDue: true,
      hasCompleted: true,
      hasWorkLog: false,
    })
  })
})
