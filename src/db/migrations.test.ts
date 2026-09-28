import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, expect, it } from 'vitest'
import { backupPayloadFixture } from '@/test/backup-fixtures'
import { clearTestDatabases, testDatabaseName, trackTestDatabase } from '@/test/database'
import { BoardQueryService } from '@/services/board-query'
import { DashboardService } from '@/services/dashboard'
import { BackupExportService } from '@/services/backup/export'
import { localDayRange, parseLocalDate } from '@/utils/dates'
import { HistaskDatabase } from './database'
import { schemaV1 } from './schema'

afterEach(clearTestDatabases)

async function legacyDatabase(invalid = false) {
  const name = testDatabaseName('timestamp-migration')
  const db = trackTestDatabase(new Dexie(name))
  db.version(1).stores(schemaV1)
  await db.open()
  const payload = backupPayloadFixture()
  const offset = '2026-09-08T10:00:00+09:00'
  for (const entity of [...payload.cards, ...payload.categories, ...payload.workLogs]) {
    entity.createdAt = offset
    entity.updatedAt = offset
  }
  payload.tags[0].createdAt = offset
  Object.assign(payload.cards[0], { dueDate: '2026-09-08', status: 'DONE', completedAt: offset, archivedAt: offset })
  if (invalid) payload.workLogs[0].createdAt = 'invalid'
  for (const table of ['cards', 'categories', 'tags', 'cardTags', 'workLogs'] as const)
    await db.table(table).bulkAdd(payload[table])
  await db.table('settings').put({ key: 'theme', value: 'dark' })
  db.close()
  return { name, payload }
}

it('upgrades actual v1 data atomically, preserving text, relationships, dates and settings', async () => {
  const { name, payload } = await legacyDatabase()
  const db = trackTestDatabase(new HistaskDatabase(name))
  await db.open()
  expect(db.verno).toBe(2)
  const utc = '2026-09-08T01:00:00.000Z'
  expect(await db.cards.get('card-1')).toEqual({ ...payload.cards[0], createdAt: utc, updatedAt: utc, completedAt: utc, archivedAt: utc })
  expect(await db.categories.get('category-1')).toEqual({ ...payload.categories[0], createdAt: utc, updatedAt: utc })
  expect(await db.tags.get('tag-1')).toEqual({ ...payload.tags[0], createdAt: utc })
  expect(await db.workLogs.get('log-1')).toEqual({ ...payload.workLogs[0], createdAt: utc, updatedAt: utc })
  expect(await db.cardTags.toArray()).toEqual(payload.cardTags)
  expect(await db.settings.get('theme')).toEqual({ key: 'theme', value: 'dark' })
  expect((await new BackupExportService(db).export()).payload.schemaVersion).toBe(1)
  db.close()
  await db.open()
  expect((await db.workLogs.get('log-1'))?.createdAt).toBe(utc)
})

it('preserves the entire v1 database if a later timestamp cannot be migrated', async () => {
  const { name, payload } = await legacyDatabase(true)
  const db = trackTestDatabase(new HistaskDatabase(name))
  await expect(db.open()).rejects.toThrow()
  db.close()
  const legacy = trackTestDatabase(new Dexie(name))
  legacy.version(1).stores(schemaV1)
  await legacy.open()
  expect(legacy.verno).toBe(1)
  for (const table of ['cards', 'categories', 'tags', 'cardTags', 'workLogs'] as const)
    expect(await legacy.table(table).toArray()).toEqual(payload[table])
  expect(await legacy.table('settings').get('theme')).toEqual({ key: 'theme', value: 'dark' })
})

it('repairs latest-log order and indexed today counts in previously imported v1 data', async () => {
  const name = testDatabaseName('timestamp-migration-queries')
  const legacy = trackTestDatabase(new Dexie(name))
  legacy.version(1).stores(schemaV1)
  await legacy.open()
  const payload = backupPayloadFixture()
  const day = parseLocalDate('2026-09-08')
  const instant = Date.parse(localDayRange(day).end) - 3600000
  const newer = new Date(instant).toISOString()
  const older = new Date(instant - 3600000 + 9 * 3600000).toISOString().replace('Z', '+09:00')
  await legacy.table('categories').bulkAdd(payload.categories)
  await legacy.table('tags').bulkAdd(payload.tags)
  await legacy.table('cardTags').bulkAdd(payload.cardTags)
  await legacy.table('cards').add(payload.cards[0])
  await legacy.table('workLogs').bulkAdd([
    { ...payload.workLogs[0], id: 'older', createdAt: older },
    { ...payload.workLogs[0], id: 'newer', createdAt: newer },
  ])
  legacy.close()
  const db = trackTestDatabase(new HistaskDatabase(name))
  await db.open()
  expect((await new BoardQueryService(db).getCards())[0].latestWorkLog?.id).toBe('newer')
  await db.workLogs.delete('newer')
  expect((await new DashboardService(db).getMetrics(day)).updatedToday).toBe(1)
})
