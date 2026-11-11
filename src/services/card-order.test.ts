import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { cardFixture } from '@/test/domain-fixtures'
import { TestServiceContext } from '@/test/service-context'
import { compareCardsManual } from './board-query'
import { CardOrderService } from './card-order'

afterEach(clearTestDatabases)

describe('CardOrderService', () => {
  it('reorders cards within a column and updates sequential sort orders', async () => {
    const database = await createTestDatabase('card-order-within')
    const service = new CardOrderService(
      database,
      new TestServiceContext('2026-09-08T12:00:00.000Z'),
    )
    await database.cards.bulkAdd([
      cardFixture({ id: 'a', status: 'TODO', sortOrder: 0, updatedAt: '2026-09-08T01:00:00.000Z' }),
      cardFixture({ id: 'b', status: 'TODO', sortOrder: 1, updatedAt: '2026-09-08T01:00:00.000Z' }),
      cardFixture({ id: 'c', status: 'TODO', sortOrder: 2, updatedAt: '2026-09-08T01:00:00.000Z' }),
    ])

    const updated = await service.moveCard({
      cardId: 'c',
      targetStatus: 'TODO',
      targetIndex: 0,
    })

    expect(updated.map((card) => `${card.id}:${card.sortOrder}`)).toEqual([
      'c:0',
      'a:1',
      'b:2',
    ])
    const stored = (await database.cards.toArray()).sort(compareCardsManual)
    expect(stored.map((card) => card.id)).toEqual(['c', 'a', 'b'])
    expect(stored.every((card) => card.updatedAt === '2026-09-08T01:00:00.000Z')).toBe(true)
  })

  it('preserves relative positions of hidden cards during filtered reorders', async () => {
    const database = await createTestDatabase('card-order-filtered')
    const service = new CardOrderService(
      database,
      new TestServiceContext('2026-09-08T12:00:00.000Z'),
    )
    await database.cards.bulkAdd([
      cardFixture({ id: 'vis-1', status: 'TODO', sortOrder: 0 }),
      cardFixture({ id: 'hidden-a', status: 'TODO', sortOrder: 1 }),
      cardFixture({ id: 'vis-2', status: 'TODO', sortOrder: 2 }),
      cardFixture({ id: 'hidden-b', status: 'TODO', sortOrder: 3 }),
    ])

    await service.moveCard({
      cardId: 'vis-2',
      targetStatus: 'TODO',
      targetIndex: 0,
      visibleCardIds: ['vis-1', 'vis-2'],
    })

    let stored = (await database.cards.toArray()).sort(compareCardsManual)
    expect(stored.map((card) => card.id)).toEqual([
      'vis-2',
      'vis-1',
      'hidden-a',
      'hidden-b',
    ])

    await service.moveCardStep('vis-2', 'down', ['vis-2', 'vis-1'])
    stored = (await database.cards.toArray()).sort(compareCardsManual)
    expect(stored.map((card) => card.id)).toEqual([
      'vis-1',
      'vis-2',
      'hidden-a',
      'hidden-b',
    ])
  })

  it('moves across columns and manages completedAt and timestamps', async () => {
    const database = await createTestDatabase('card-order-cross')
    const service = new CardOrderService(
      database,
      new TestServiceContext('2026-09-08T12:00:00.000Z'),
    )
    await database.cards.bulkAdd([
      cardFixture({ id: 't1', status: 'TODO', sortOrder: 0 }),
      cardFixture({ id: 't2', status: 'TODO', sortOrder: 1 }),
      cardFixture({ id: 'd1', status: 'DONE', sortOrder: 0, completedAt: '2026-09-07T00:00:00.000Z' }),
    ])

    const doneCol = await service.moveCard({
      cardId: 't1',
      targetStatus: 'DONE',
      targetIndex: 0,
    })

    expect(doneCol.map((card) => card.id)).toEqual(['t1', 'd1'])
    const moved = await database.cards.get('t1')
    expect(moved?.status).toBe('DONE')
    expect(moved?.completedAt).toBe('2026-09-08T12:00:00.000Z')
    expect(moved?.updatedAt).toBe('2026-09-08T12:00:00.000Z')

    const todoCol = (
      await database.cards.where('status').equals('TODO').toArray()
    ).sort(compareCardsManual)
    expect(todoCol.map((card) => `${card.id}:${card.sortOrder}`)).toEqual(['t2:0'])

    await service.moveCard({
      cardId: 't1',
      targetStatus: 'IN_PROGRESS',
    })
    const reopened = await database.cards.get('t1')
    expect(reopened?.status).toBe('IN_PROGRESS')
    expect('completedAt' in (reopened ?? {})).toBe(false)
  })
})
