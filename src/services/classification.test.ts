import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { HistaskDatabase, openHistaskDatabase } from '@/db/database'
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
import { ClassificationService } from './classification'

afterEach(clearTestDatabases)

describe('ClassificationService', () => {
  it('creates and updates categories and tags using the restrained palette', async () => {
    const database = await createTestDatabase('classification-crud')
    const context = new TestServiceContext(
      '2026-09-08T01:00:00.000Z',
      ['category-1', 'tag-1'],
    )
    const service = new ClassificationService(database, context)

    const category = await service.createCategory({
      name: 'ERP',
      color: 'indigo',
    })
    const tag = await service.createTag({ name: 'deploy', color: 'slate' })
    context.setNow('2026-09-08T02:00:00.000Z')
    const renamedCategory = await service.updateCategory(category.id, {
      name: 'ERP Platform',
      color: null,
    })
    const renamedTag = await service.updateTag(tag.id, {
      name: 'release',
      color: 'teal',
    })

    expect(renamedCategory).toMatchObject({
      name: 'ERP Platform',
      updatedAt: '2026-09-08T02:00:00.000Z',
    })
    expect(renamedCategory).not.toHaveProperty('color')
    expect(renamedTag).toMatchObject({ name: 'release', color: 'teal' })
    await expect(
      service.createTag({ name: 'loud', color: '#ff0000' }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('persists rename and color changes after reopening IndexedDB', async () => {
    const name = testDatabaseName('classification-reopen')
    const first = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(first)
    const context = new TestServiceContext(
      '2026-09-08T01:00:00.000Z',
      ['category-1', 'tag-1'],
    )
    const service = new ClassificationService(first, context)
    const category = await service.createCategory({ name: 'ERP' })
    const tag = await service.createTag({ name: 'bug' })
    await first.cards.add(cardFixture({ id: 'card-1' }))
    await service.updateCategory(category.id, { color: 'amber' })
    await service.updateTag(tag.id, { color: 'rose' })
    await service.attachTag('card-1', tag.id)
    first.close()

    const reopened = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(reopened)
    expect((await reopened.categories.get(category.id))?.color).toBe('amber')
    expect((await reopened.tags.get(tag.id))?.color).toBe('rose')
    expect(await reopened.cardTags.get(['card-1', tag.id])).toEqual({
      cardId: 'card-1',
      tagId: tag.id,
    })

    await new ClassificationService(reopened, context).detachTag(
      'card-1',
      tag.id,
    )
    reopened.close()
    const reopenedAfterDetach = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(reopenedAfterDetach)
    expect(await reopenedAfterDetach.cardTags.toArray()).toEqual([])
  })

  it('attaches multiple tags, rejects duplicates, and detaches one relation', async () => {
    const database = await createTestDatabase('classification-relations')
    const service = new ClassificationService(
      database,
      new TestServiceContext('2026-09-08T01:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.tags.bulkAdd([
      tagFixture({ id: 'tag-1' }),
      tagFixture({ id: 'tag-2' }),
    ])

    await service.attachTag('card-1', 'tag-1')
    await service.attachTag('card-1', 'tag-2')
    await expect(service.attachTag('card-1', 'tag-1')).rejects.toMatchObject({
      code: 'DUPLICATE_RELATION',
    } satisfies Partial<DomainError>)
    await service.detachTag('card-1', 'tag-1')

    expect(await database.cardTags.toArray()).toEqual([
      { cardId: 'card-1', tagId: 'tag-2' },
    ])
  })

  it('rejects relations to missing Cards or Tags without writing', async () => {
    const database = await createTestDatabase('classification-orphans')
    const service = new ClassificationService(
      database,
      new TestServiceContext('2026-09-08T01:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.tags.add(tagFixture({ id: 'tag-1' }))

    await expect(service.attachTag('missing', 'tag-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      entity: 'Card',
    } satisfies Partial<DomainError>)
    await expect(service.attachTag('card-1', 'missing')).rejects.toMatchObject(
      {
        code: 'NOT_FOUND',
        entity: 'Tag',
      } satisfies Partial<DomainError>,
    )
    expect(await database.cardTags.count()).toBe(0)
  })

  it('deletes a Category by clearing links while preserving Cards and WorkLogs', async () => {
    const database = await createTestDatabase('classification-category-delete')
    const service = new ClassificationService(
      database,
      new TestServiceContext('2026-09-08T03:00:00.000Z'),
    )
    await database.categories.add(categoryFixture({ id: 'category-1' }))
    await database.cards.bulkAdd([
      cardFixture({ id: 'card-1', categoryId: 'category-1' }),
      cardFixture({ id: 'card-2', categoryId: 'category-1' }),
      cardFixture({ id: 'card-3' }),
    ])
    await database.workLogs.add(workLogFixture({ id: 'log-1' }))

    await service.deleteCategory('category-1')

    expect(await database.categories.count()).toBe(0)
    expect(await database.cards.count()).toBe(3)
    expect(await database.workLogs.count()).toBe(1)
    expect(
      (await database.cards.toArray()).every(
        ({ categoryId }) => categoryId === undefined,
      ),
    ).toBe(true)
  })

  it('deletes only a Tag and its relations while preserving all work', async () => {
    const database = await createTestDatabase('classification-tag-delete')
    const service = new ClassificationService(
      database,
      new TestServiceContext('2026-09-08T03:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.tags.bulkAdd([
      tagFixture({ id: 'delete-me' }),
      tagFixture({ id: 'keep-me' }),
    ])
    await database.cardTags.bulkAdd([
      { cardId: 'card-1', tagId: 'delete-me' },
      { cardId: 'card-1', tagId: 'keep-me' },
    ])
    await database.workLogs.add(workLogFixture({ id: 'log-1' }))

    await service.deleteTag('delete-me')

    expect(await database.cards.count()).toBe(1)
    expect(await database.workLogs.count()).toBe(1)
    expect((await database.tags.toArray()).map(({ id }) => id)).toEqual([
      'keep-me',
    ])
    expect(await database.cardTags.toArray()).toEqual([
      { cardId: 'card-1', tagId: 'keep-me' },
    ])
  })

  it('rolls back cleared Card links if Category deletion fails', async () => {
    const database = await createTestDatabase('classification-rollback')
    const service = new ClassificationService(
      database,
      new TestServiceContext('2026-09-08T03:00:00.000Z'),
    )
    await database.categories.add(categoryFixture({ id: 'category-1' }))
    await database.cards.add(
      cardFixture({ id: 'card-1', categoryId: 'category-1' }),
    )
    database.categories.hook('deleting', () => {
      throw new Error('category deletion failed')
    })

    await expect(service.deleteCategory('category-1')).rejects.toMatchObject({
      code: 'TRANSACTION_FAILED',
    })
    expect(await database.categories.count()).toBe(1)
    expect((await database.cards.get('card-1'))?.categoryId).toBe('category-1')
  })
})
