import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearTestDatabases,
  createTestDatabase,
} from '@/test/database'
import {
  cardFixture,
  categoryFixture,
  tagFixture,
  workLogFixture,
} from '@/test/domain-fixtures'
import { BoardQueryService } from './board-query'

afterEach(clearTestDatabases)

describe('BoardQueryService', () => {
  it('projects category, sorted tags, latest WorkLog, and count in one read', async () => {
    const database = await createTestDatabase('board-projection')
    const service = new BoardQueryService(database)
    await database.categories.add(categoryFixture({ id: 'category-1' }))
    await database.tags.bulkAdd([
      tagFixture({ id: 'tag-b', name: 'waiting' }),
      tagFixture({ id: 'tag-a', name: 'bug' }),
    ])
    await database.cards.bulkAdd([
      cardFixture({
        id: 'card-2',
        title: 'Second',
        sortOrder: 2,
      }),
      cardFixture({
        id: 'card-1',
        title: 'First',
        categoryId: 'category-1',
        sortOrder: 1,
      }),
      cardFixture({ id: 'archived', archivedAt: '2026-09-08T01:00:00.000Z' }),
    ])
    await database.cardTags.bulkAdd([
      { cardId: 'card-1', tagId: 'tag-b' },
      { cardId: 'card-1', tagId: 'tag-a' },
    ])
    await database.workLogs.bulkAdd([
      workLogFixture({
        id: 'older',
        createdAt: '2026-09-08T01:00:00.000Z',
      }),
      workLogFixture({
        id: 'latest',
        createdAt: '2026-09-08T02:00:00.000Z',
      }),
      workLogFixture({ id: 'archived-log', cardId: 'archived' }),
    ])

    const projection = await service.getCards()

    expect(projection.map(({ card }) => card.id)).toEqual(['card-1', 'card-2'])
    expect(projection[0]).toMatchObject({
      category: { id: 'category-1' },
      tags: [{ id: 'tag-a' }, { id: 'tag-b' }],
      latestWorkLog: { id: 'latest' },
      workLogCount: 2,
    })
    expect(projection[1]).toMatchObject({
      tags: [],
      latestWorkLog: undefined,
      workLogCount: 0,
    })
  })

  it('uses a stable ID tie-break for latest WorkLog projection', async () => {
    const database = await createTestDatabase('board-latest-tie')
    const service = new BoardQueryService(database)
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.workLogs.bulkAdd([
      workLogFixture({ id: 'log-a' }),
      workLogFixture({ id: 'log-z' }),
    ])

    expect((await service.getCards())[0].latestWorkLog?.id).toBe('log-z')
  })

  it('reacts when the latest log is added and deleted', async () => {
    const database = await createTestDatabase('board-reactive')
    const service = new BoardQueryService(database)
    await database.cards.add(cardFixture({ id: 'card-1' }))
    const snapshots: Array<{ latest?: string; count: number }> = []
    let resolveInitial: (() => void) | undefined
    let resolveAdded: (() => void) | undefined
    let resolveDeleted: (() => void) | undefined
    const initial = new Promise<void>((resolve) => {
      resolveInitial = resolve
    })
    const added = new Promise<void>((resolve) => {
      resolveAdded = resolve
    })
    const deleted = new Promise<void>((resolve) => {
      resolveDeleted = resolve
    })
    const unsubscribe = service.observeCards().subscribe(
      ([card]) => {
        snapshots.push({
          latest: card.latestWorkLog?.id,
          count: card.workLogCount,
        })
        if (snapshots.length === 1) resolveInitial?.()
        if (snapshots.length === 2) resolveAdded?.()
        if (snapshots.length === 3) resolveDeleted?.()
      },
      () => undefined,
    )

    await initial
    await database.workLogs.add(workLogFixture({ id: 'log-1' }))
    await added
    await database.workLogs.delete('log-1')
    await deleted
    unsubscribe()

    expect(snapshots).toEqual([
      { latest: undefined, count: 0 },
      { latest: 'log-1', count: 1 },
      { latest: undefined, count: 0 },
    ])
  })

  it('reacts to status changes and removes archived Cards', async () => {
    const database = await createTestDatabase('board-card-reactive')
    const service = new BoardQueryService(database)
    await database.cards.add(cardFixture({ id: 'card-1' }))
    const snapshots: string[][] = []
    let resolveInitial: (() => void) | undefined
    let resolveStatus: (() => void) | undefined
    let resolveArchived: (() => void) | undefined
    const initial = new Promise<void>((resolve) => {
      resolveInitial = resolve
    })
    const status = new Promise<void>((resolve) => {
      resolveStatus = resolve
    })
    const archived = new Promise<void>((resolve) => {
      resolveArchived = resolve
    })
    const unsubscribe = service.observeCards().subscribe(
      (cards) => {
        snapshots.push(cards.map(({ card }) => `${card.id}:${card.status}`))
        if (snapshots.length === 1) resolveInitial?.()
        if (snapshots.length === 2) resolveStatus?.()
        if (snapshots.length === 3) resolveArchived?.()
      },
      () => undefined,
    )

    await initial
    await database.cards.update('card-1', { status: 'IN_PROGRESS' })
    await status
    await database.cards.update('card-1', {
      archivedAt: '2026-09-08T03:00:00.000Z',
    })
    await archived
    unsubscribe()

    expect(snapshots).toEqual([
      ['card-1:TODO'],
      ['card-1:IN_PROGRESS'],
      [],
    ])
  })
})
