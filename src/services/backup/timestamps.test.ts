import 'fake-indexeddb/auto'
import { afterEach, expect, it } from 'vitest'
import { backupPayloadFixture } from '@/test/backup-fixtures'
import { workLogFixture } from '@/test/domain-fixtures'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { BoardQueryService } from '@/services/board-query'
import { WorkLogService } from '@/services/worklogs'
import { DexieWorkLogRepository } from '@/repositories/worklogs'
import { DashboardService } from '@/services/dashboard'
import { localDayRange, parseLocalDate } from '@/utils/dates'
import { BackupImportService } from './import'
import { prepareBackup } from './prepare'

afterEach(clearTestDatabases)

it('orders imported mixed-offset and fractional timestamps by actual time', async () => {
  const db = await createTestDatabase('import-offset')
  await new BackupImportService(db).replace(prepareBackup(backupPayloadFixture({
    workLogs: [
      workLogFixture({ id: 'older', createdAt: '2026-09-08T10:00:00+09:00' }),
      workLogFixture({ id: 'newer', createdAt: '2026-09-08T02:00:00.001Z' }),
      workLogFixture({ id: 'middle', createdAt: '2026-09-07T22:00:00-04:00' }),
    ],
  })))
  expect((await new BoardQueryService(db).getCards())[0].latestWorkLog?.id).toBe('newer')
  for (const reader of [new WorkLogService(db), new DexieWorkLogRepository(db)]) {
    expect((await reader.listForCard('card-1')).map(log => log.id)).toEqual(['newer', 'middle', 'older'])
  }
})

it('counts an imported offset timestamp inside today', async () => {
  const db = await createTestDatabase('import-day')
  const day = parseLocalDate('2026-09-08')
  const instant = Date.parse(localDayRange(day).end) - 3600000
  const timestamp = new Date(instant + 9 * 3600000).toISOString().replace('Z', '+09:00')
  await new BackupImportService(db).replace(prepareBackup(backupPayloadFixture({
    workLogs: [workLogFixture({ createdAt: timestamp, updatedAt: timestamp })],
  })))
  expect((await new DashboardService(db).getMetrics(day)).updatedToday).toBe(1)
})

it('normalizes every backup timestamp without changing calendar dates or source objects', () => {
  const source = backupPayloadFixture()
  const offset = '2026-09-08T10:00:00.1+09:00'
  const utc = '2026-09-08T01:00:00.100Z'
  source.exportedAt = offset
  for (const entity of [...source.cards, ...source.categories, ...source.workLogs]) {
    entity.createdAt = offset
    entity.updatedAt = offset
  }
  source.tags[0].createdAt = offset
  Object.assign(source.cards[0], { status: 'DONE', completedAt: offset, archivedAt: offset, dueDate: '2026-09-08' })
  const normalized = prepareBackup(source).toPayload()
  expect(normalized.exportedAt).toBe(utc)
  for (const entity of [...normalized.cards, ...normalized.categories, ...normalized.workLogs]) {
    expect(entity.createdAt).toBe(utc)
    expect(entity.updatedAt).toBe(utc)
  }
  expect(normalized.tags[0].createdAt).toBe(utc)
  expect(normalized.cards[0]).toMatchObject({ completedAt: utc, archivedAt: utc, dueDate: '2026-09-08' })
  expect(source.cards[0].createdAt).toBe(offset)
})

it.each([
  ['before start', -1, false, 0],
  ['at start', 0, false, 1],
  ['before end', -1, true, 1],
  ['at end', 0, true, 0],
] as const)('keeps the local-day boundary correct %s after import', async (_label, delta, useEnd, expected) => {
  const db = await createTestDatabase('import-day-boundary')
  const day = parseLocalDate('2026-09-08')
  const range = localDayRange(day)
  const instant = Date.parse(useEnd ? range.end : range.start) + delta
  const timestamp = new Date(instant - 4 * 3600000).toISOString().replace('Z', '-04:00')
  await new BackupImportService(db).replace(prepareBackup(backupPayloadFixture({
    workLogs: [workLogFixture({ createdAt: timestamp, updatedAt: timestamp })],
  })))
  expect((await new DashboardService(db).getMetrics(day)).updatedToday).toBe(expected)
})
