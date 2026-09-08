import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { HistaskDatabase, openHistaskDatabase } from '@/db/database'
import { DexieCardRepository } from '@/repositories/cards'
import { DomainError } from '@/services/domain-errors'
import { ValidationError } from '@/services/validation'
import {
  clearTestDatabases,
  createTestDatabase,
  testDatabaseName,
  trackTestDatabase,
} from '@/test/database'
import {
  cardFixture,
  categoryFixture,
  tagFixture,
  workLogFixture,
} from '@/test/domain-fixtures'
import { TestServiceContext } from '@/test/service-context'
import { CardService } from './cards'

afterEach(clearTestDatabases)

describe('CardService', () => {
  it('quick-creates valid cards at the end of their status column', async () => {
    const database = await createTestDatabase('card-create')
    const context = new TestServiceContext(
      '2026-09-08T01:00:00.000Z',
      ['card-new'],
    )
    const service = new CardService(database, context)
    const category = categoryFixture({ id: 'category-1' })
    const tag = tagFixture({ id: 'tag-1' })
    await database.cards.bulkAdd([
      cardFixture({ id: 'existing-1', sortOrder: 2 }),
      cardFixture({ id: 'existing-2', sortOrder: 7 }),
    ])
    await database.categories.add(category)
    await database.tags.add(tag)

    const created = await service.create({
      title: 'Prepare release',
      categoryId: category.id,
      tagIds: [tag.id, tag.id],
    })

    expect(created).toMatchObject({
      id: 'card-new',
      title: 'Prepare release',
      status: 'TODO',
      priority: 'NONE',
      categoryId: category.id,
      sortOrder: 8,
      createdAt: '2026-09-08T01:00:00.000Z',
      updatedAt: '2026-09-08T01:00:00.000Z',
    })
    expect(await database.cardTags.toArray()).toEqual([
      { cardId: created.id, tagId: tag.id },
    ])
  })

  it('rejects blank titles and missing category or tag references atomically', async () => {
    const database = await createTestDatabase('card-validation')
    const service = new CardService(
      database,
      new TestServiceContext('2026-09-08T01:00:00.000Z', [
        'blank',
        'missing-category',
        'missing-tag',
      ]),
    )

    await expect(service.create({ title: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(
      service.create({ title: 'Card', categoryId: 'missing' }),
    ).rejects.toMatchObject({
      code: 'INVALID_REFERENCE',
      entity: 'Category',
    } satisfies Partial<DomainError>)
    await expect(
      service.create({ title: 'Card', tagIds: ['missing'] }),
    ).rejects.toMatchObject({
      code: 'INVALID_REFERENCE',
      entity: 'Tag',
    } satisfies Partial<DomainError>)
    expect(await database.cards.count()).toBe(0)
    expect(await database.cardTags.count()).toBe(0)
  })

  it('updates fields, clears optional values, and replaces tags atomically', async () => {
    const database = await createTestDatabase('card-update')
    const context = new TestServiceContext('2026-09-08T02:00:00.000Z')
    const service = new CardService(database, context)
    await database.categories.add(categoryFixture({ id: 'category-1' }))
    await database.tags.bulkAdd([
      tagFixture({ id: 'old-tag' }),
      tagFixture({ id: 'new-tag' }),
    ])
    await database.cards.add(
      cardFixture({
        id: 'card-1',
        description: 'Old',
        categoryId: 'category-1',
        dueDate: '2026-09-10',
      }),
    )
    await database.cardTags.add({ cardId: 'card-1', tagId: 'old-tag' })

    const updated = await service.update('card-1', {
      title: 'Updated',
      description: null,
      categoryId: null,
      dueDate: null,
      priority: 'HIGH',
      sortOrder: 4.5,
      tagIds: ['new-tag'],
    })

    expect(updated).toMatchObject({
      title: 'Updated',
      priority: 'HIGH',
      sortOrder: 4.5,
      updatedAt: '2026-09-08T02:00:00.000Z',
    })
    expect(updated).not.toHaveProperty('description')
    expect(updated).not.toHaveProperty('categoryId')
    expect(updated).not.toHaveProperty('dueDate')
    expect(await database.cardTags.toArray()).toEqual([
      { cardId: 'card-1', tagId: 'new-tag' },
    ])
  })

  it('sets, preserves, clears, and resets completedAt across status changes', async () => {
    const database = await createTestDatabase('card-completion')
    const context = new TestServiceContext('2026-09-08T03:00:00.000Z')
    const service = new CardService(database, context)
    await database.cards.add(cardFixture({ id: 'card-1' }))

    const done = await service.setStatus('card-1', 'DONE')
    expect(done.completedAt).toBe('2026-09-08T03:00:00.000Z')
    context.setNow('2026-09-08T04:00:00.000Z')
    const stillDone = await service.update('card-1', { title: 'Renamed' })
    expect(stillDone.completedAt).toBe('2026-09-08T03:00:00.000Z')
    const reopened = await service.setStatus('card-1', 'IN_PROGRESS')
    expect(reopened.completedAt).toBeUndefined()
    context.setNow('2026-09-08T05:00:00.000Z')
    const doneAgain = await service.setStatus('card-1', 'DONE')
    expect(doneAgain.completedAt).toBe('2026-09-08T05:00:00.000Z')
  })

  it('rolls back card and tag changes when relation persistence fails', async () => {
    const database = await createTestDatabase('card-tag-rollback')
    const service = new CardService(
      database,
      new TestServiceContext('2026-09-08T03:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1', title: 'Original' }))
    await database.tags.bulkAdd([
      tagFixture({ id: 'old-tag' }),
      tagFixture({ id: 'new-tag' }),
    ])
    await database.cardTags.add({ cardId: 'card-1', tagId: 'old-tag' })
    database.cardTags.hook('creating', () => {
      throw new Error('relation failed')
    })

    await expect(
      service.update('card-1', { title: 'Changed', tagIds: ['new-tag'] }),
    ).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })
    expect((await database.cards.get('card-1'))?.title).toBe('Original')
    expect(await database.cardTags.toArray()).toEqual([
      { cardId: 'card-1', tagId: 'old-tag' },
    ])
  })

  it('archives without deleting history and restores default visibility', async () => {
    const database = await createTestDatabase('card-archive')
    const context = new TestServiceContext('2026-09-08T03:00:00.000Z')
    const service = new CardService(database, context)
    const repository = new DexieCardRepository(database)
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.workLogs.add(workLogFixture({ id: 'log-1' }))

    await service.archive('card-1')
    expect(await repository.list()).toEqual([])
    expect(await database.workLogs.count()).toBe(1)
    expect((await repository.list({ includeArchived: true }))[0].archivedAt).toBe(
      '2026-09-08T03:00:00.000Z',
    )

    context.setNow('2026-09-08T04:00:00.000Z')
    await service.restore('card-1')
    expect((await repository.list()).map(({ id }) => id)).toEqual(['card-1'])
    expect(await database.workLogs.count()).toBe(1)
  })

  it('deletes a card and all dependent data in one transaction', async () => {
    const database = await createTestDatabase('card-cascade')
    const service = new CardService(
      database,
      new TestServiceContext('2026-09-08T03:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.tags.add(tagFixture({ id: 'tag-1' }))
    await database.cardTags.add({ cardId: 'card-1', tagId: 'tag-1' })
    await database.workLogs.add(workLogFixture({ id: 'log-1' }))

    await service.deletePermanently('card-1')

    expect(await database.cards.count()).toBe(0)
    expect(await database.cardTags.count()).toBe(0)
    expect(await database.workLogs.count()).toBe(0)
    expect(await database.tags.count()).toBe(1)
  })

  it('restores cascade children when final card deletion fails', async () => {
    const database = await createTestDatabase('card-cascade-rollback')
    const service = new CardService(
      database,
      new TestServiceContext('2026-09-08T03:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.tags.add(tagFixture({ id: 'tag-1' }))
    await database.cardTags.add({ cardId: 'card-1', tagId: 'tag-1' })
    await database.workLogs.add(workLogFixture({ id: 'log-1' }))
    database.cards.hook('deleting', () => {
      throw new Error('card deletion failed')
    })

    await expect(service.deletePermanently('card-1')).rejects.toMatchObject({
      code: 'TRANSACTION_FAILED',
    })
    expect(await database.cards.count()).toBe(1)
    expect(await database.cardTags.count()).toBe(1)
    expect(await database.workLogs.count()).toBe(1)
  })

  it('keeps CRUD and ordering values after the database is reopened', async () => {
    const name = testDatabaseName('card-reopen')
    const first = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(first)
    const context = new TestServiceContext(
      '2026-09-08T03:00:00.000Z',
      ['card-1'],
    )
    const firstService = new CardService(first, context)
    await firstService.create({ title: 'Persisted' })
    context.setNow('2026-09-08T04:00:00.000Z')
    await firstService.setStatus('card-1', 'WAITING', 12)
    first.close()

    const reopened = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(reopened)
    expect(await reopened.cards.get('card-1')).toMatchObject({
      title: 'Persisted',
      status: 'WAITING',
      sortOrder: 12,
      updatedAt: '2026-09-08T04:00:00.000Z',
    })
  })
})
