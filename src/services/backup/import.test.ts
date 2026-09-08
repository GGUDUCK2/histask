import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HistaskDatabase, openHistaskDatabase } from '@/db/database'
import { BoardQueryService } from '@/services/board-query'
import { DashboardService } from '@/services/dashboard'
import { DeleteAllDataService } from '@/services/delete-all-data'
import { backupPayloadFixture } from '@/test/backup-fixtures'
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
import { BackupImportService } from './import'
import { prepareBackup } from './prepare'

afterEach(clearTestDatabases)

async function seedOldDataset(database: HistaskDatabase): Promise<void> {
  await database.categories.add(categoryFixture({ id: 'old-category' }))
  await database.tags.add(tagFixture({ id: 'old-tag' }))
  await database.cards.add(
    cardFixture({ id: 'old-card', categoryId: 'old-category' }),
  )
  await database.cardTags.add({ cardId: 'old-card', tagId: 'old-tag' })
  await database.workLogs.add(
    workLogFixture({ id: 'old-log', cardId: 'old-card' }),
  )
}

async function businessSnapshot(database: HistaskDatabase) {
  return {
    categories: await database.categories.toArray(),
    tags: await database.tags.toArray(),
    cardTags: await database.cardTags.toArray(),
    cards: await database.cards.toArray(),
    workLogs: await database.workLogs.toArray(),
  }
}

describe('BackupImportService', () => {
  it('replaces all business data while preserving device settings', async () => {
    const database = await createTestDatabase('backup-replace')
    await seedOldDataset(database)
    await database.settings.add({ key: 'theme', value: 'dark' })
    const service = new BackupImportService(database)
    const prepared = prepareBackup(backupPayloadFixture())

    await expect(service.replace(prepared)).resolves.toEqual(prepared.counts)

    expect((await database.categories.toArray()).map(({ id }) => id)).toEqual([
      'category-1',
    ])
    expect((await database.tags.toArray()).map(({ id }) => id)).toEqual([
      'tag-1',
    ])
    expect((await database.cards.toArray()).map(({ id }) => id)).toEqual([
      'card-1',
    ])
    expect((await database.workLogs.toArray()).map(({ id }) => id)).toEqual([
      'log-1',
    ])
    expect(await database.cardTags.toArray()).toEqual([
      { cardId: 'card-1', tagId: 'tag-1' },
    ])
    expect(await database.settings.get('theme')).toEqual({
      key: 'theme',
      value: 'dark',
    })
  })

  it('supports an empty replacement without clearing settings', async () => {
    const database = await createTestDatabase('backup-empty-import')
    await seedOldDataset(database)
    await database.settings.add({ key: 'theme', value: 'light' })
    const empty = prepareBackup(
      backupPayloadFixture({
        categories: [],
        tags: [],
        cardTags: [],
        cards: [],
        workLogs: [],
      }),
    )

    await new BackupImportService(database).replace(empty)

    expect(await businessSnapshot(database)).toEqual({
      categories: [],
      tags: [],
      cardTags: [],
      cards: [],
      workLogs: [],
    })
    expect(await database.settings.get('theme')).toEqual({
      key: 'theme',
      value: 'light',
    })
  })

  it('rolls back every cleared table when a later insert fails', async () => {
    const database = await createTestDatabase('backup-import-rollback')
    await seedOldDataset(database)
    const before = await businessSnapshot(database)
    database.workLogs.hook('creating', () => {
      throw new Error('work log insert failed')
    })

    await expect(
      new BackupImportService(database).replace(
        prepareBackup(backupPayloadFixture()),
      ),
    ).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })

    expect(await businessSnapshot(database)).toEqual(before)
  })

  it('does not enter a write transaction for an invalid final record', async () => {
    const database = await createTestDatabase('backup-invalid-no-write')
    await seedOldDataset(database)
    const before = await businessSnapshot(database)
    const transactionSpy = vi.spyOn(database, 'transaction')
    const payload = backupPayloadFixture()
    const invalid = {
      ...payload,
      workLogs: [
        payload.workLogs[0],
        { ...payload.workLogs[0], id: 'last-log', content: '   ' },
      ],
    }

    expect(() => prepareBackup(invalid)).toThrowError(
      expect.objectContaining({ code: 'INVALID_FIELD' }),
    )
    expect(transactionSpy).not.toHaveBeenCalled()
    expect(await businessSnapshot(database)).toEqual(before)
  })

  it('updates subscriptions and recomputes latest and dashboard projections', async () => {
    const database = await createTestDatabase('backup-import-reactive')
    await database.cards.add(cardFixture({ id: 'old-card' }))
    const board = new BoardQueryService(database)
    const snapshots: string[][] = []
    let resolveInitial: (() => void) | undefined
    let resolveImported: (() => void) | undefined
    const initial = new Promise<void>((resolve) => {
      resolveInitial = resolve
    })
    const imported = new Promise<void>((resolve) => {
      resolveImported = resolve
    })
    const unsubscribe = board.observeCards().subscribe(
      (cards) => {
        snapshots.push(cards.map(({ card }) => card.id))
        if (snapshots.length === 1) resolveInitial?.()
        if (snapshots.some((ids) => ids.includes('card-1')))
          resolveImported?.()
      },
      () => undefined,
    )
    await initial

    await new BackupImportService(database).replace(
      prepareBackup(backupPayloadFixture()),
    )
    await imported
    unsubscribe()

    const [projection] = await board.getCards()
    expect(projection).toMatchObject({
      card: { id: 'card-1' },
      latestWorkLog: { id: 'log-1' },
      workLogCount: 1,
    })
    const day = new Date(backupPayloadFixture().workLogs[0].createdAt)
    await expect(
      new DashboardService(database).getMetrics(day),
    ).resolves.toEqual({
      total: 1,
      inProgress: 1,
      waiting: 0,
      done: 0,
      updatedToday: 1,
    })
    expect(snapshots[0]).toEqual(['old-card'])
    expect(snapshots.at(-1)).toEqual(['card-1'])
  })

  it('preserves archived state and imported data after reopening', async () => {
    const name = testDatabaseName('backup-import-reopen')
    const first = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(first)
    const payload = backupPayloadFixture({
      cards: [
        cardFixture({
          id: 'card-1',
          categoryId: 'category-1',
          status: 'IN_PROGRESS',
          archivedAt: '2026-09-08T09:00:00.000Z',
        }),
      ],
    })
    await new BackupImportService(first).replace(prepareBackup(payload))
    first.close()

    const reopened = trackTestDatabase(new HistaskDatabase(name))
    await openHistaskDatabase(reopened)
    expect((await reopened.cards.get('card-1'))?.archivedAt).toBe(
      '2026-09-08T09:00:00.000Z',
    )
    expect(await reopened.workLogs.get('log-1')).toBeDefined()
    expect(await new BoardQueryService(reopened).getCards()).toEqual([])
  })
})

describe('DeleteAllDataService', () => {
  it('clears business data and settings in one operation', async () => {
    const database = await createTestDatabase('delete-all')
    await seedOldDataset(database)
    await database.settings.add({ key: 'theme', value: 'dark' })

    await new DeleteAllDataService(database).deleteAll()

    expect(await businessSnapshot(database)).toEqual({
      categories: [],
      tags: [],
      cardTags: [],
      cards: [],
      workLogs: [],
    })
    expect(await database.settings.toArray()).toEqual([])
  })

  it('rolls back all clears when deleting settings fails', async () => {
    const database = await createTestDatabase('delete-all-rollback')
    await seedOldDataset(database)
    await database.settings.add({ key: 'theme', value: 'dark' })
    const before = await businessSnapshot(database)
    vi.spyOn(database.settings, 'clear').mockRejectedValueOnce(
      new Error('settings clear failed'),
    )

    await expect(
      new DeleteAllDataService(database).deleteAll(),
    ).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })
    expect(await businessSnapshot(database)).toEqual(before)
    expect(await database.settings.get('theme')).toBeDefined()
  })
})
