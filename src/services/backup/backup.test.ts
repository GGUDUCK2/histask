import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import type { BackupPayload } from '@/types/backup'
import { backupPayloadFixture } from '@/test/backup-fixtures'
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
import { TestServiceContext } from '@/test/service-context'
import { toLocalDateKey } from '@/utils/dates'
import { BackupValidationError } from './errors'
import { BackupExportService } from './export'
import { prepareBackup } from './prepare'
import { parseBackupJson, validateBackupPayload } from './validate'

afterEach(clearTestDatabases)

describe('BackupExportService', () => {
  it('exports an empty valid payload with the local-date filename', async () => {
    const database = await createTestDatabase('backup-empty-export')
    await database.settings.add({ key: 'theme', value: 'dark' })
    const service = new BackupExportService(
      database,
      new TestServiceContext('2026-09-08T15:30:00.000Z'),
    )

    const exported = await service.export()

    expect(exported.filename).toBe(
      `histask-backup-${toLocalDateKey(new Date('2026-09-08T15:30:00.000Z'))}.json`,
    )
    expect(exported.mimeType).toBe('application/json')
    expect(exported.payload).toEqual({
      app: 'Histask',
      schemaVersion: 1,
      exportedAt: '2026-09-08T15:30:00.000Z',
      categories: [],
      tags: [],
      cardTags: [],
      cards: [],
      workLogs: [],
    })
    expect(validateBackupPayload(parseBackupJson(exported.json))).toEqual(
      exported.payload,
    )
    expect(exported.json).not.toContain('settings')
    expect(exported.json).not.toContain('theme')
  })

  it('exports every business collection, archived Cards, and original text', async () => {
    const database = await createTestDatabase('backup-populated-export')
    const category = categoryFixture({ id: 'category-1', color: 'indigo' })
    const tag = tagFixture({ id: 'tag-1', color: 'slate' })
    const card = cardFixture({
      id: 'card-1',
      categoryId: category.id,
      archivedAt: '2026-09-08T09:00:00.000Z',
    })
    const workLog = workLogFixture({
      id: 'log-1',
      cardId: card.id,
      content: '원문\n<script>텍스트로 보존</script>',
    })
    await database.categories.add(category)
    await database.tags.add(tag)
    await database.cards.add(card)
    await database.cardTags.add({ cardId: card.id, tagId: tag.id })
    await database.workLogs.add(workLog)

    const exported = await new BackupExportService(
      database,
      new TestServiceContext('2026-09-08T10:00:00.000Z'),
    ).export()

    expect(exported.payload.categories).toEqual([category])
    expect(exported.payload.tags).toEqual([tag])
    expect(exported.payload.cards).toEqual([card])
    expect(exported.payload.cardTags).toEqual([
      { cardId: card.id, tagId: tag.id },
    ])
    expect(exported.payload.workLogs).toEqual([workLog])
    expect(prepareBackup(exported.payload).counts).toEqual({
      categories: 1,
      tags: 1,
      cardTags: 1,
      cards: 1,
      workLogs: 1,
    })
  })

  it('takes an all-before or all-after snapshot during a concurrent write', async () => {
    const database = await createTestDatabase('backup-concurrent-export')
    const category = categoryFixture({ id: 'category-1' })
    const tag = tagFixture({ id: 'tag-1' })
    const card = cardFixture({ id: 'card-1', categoryId: category.id })
    const log = workLogFixture({ id: 'log-1', cardId: card.id })
    const service = new BackupExportService(
      database,
      new TestServiceContext('2026-09-08T10:00:00.000Z'),
    )

    const exportPromise = service.export()
    const writePromise = database.transaction(
      'rw',
      [
        database.cards,
        database.categories,
        database.tags,
        database.cardTags,
        database.workLogs,
      ],
      async () => {
        await database.categories.add(category)
        await database.tags.add(tag)
        await database.cards.add(card)
        await database.cardTags.add({ cardId: card.id, tagId: tag.id })
        await database.workLogs.add(log)
      },
    )
    const [exported] = await Promise.all([exportPromise, writePromise])

    const lengths = [
      exported.payload.categories.length,
      exported.payload.tags.length,
      exported.payload.cardTags.length,
      exported.payload.cards.length,
      exported.payload.workLogs.length,
    ]
    expect(lengths.every((length) => length === lengths[0])).toBe(true)
    expect(lengths[0] === 0 || lengths[0] === 1).toBe(true)
    expect(await database.cards.count()).toBe(1)
    expect(validateBackupPayload(exported.payload)).toEqual(exported.payload)
  })
})

describe('backup validation and preparation', () => {
  it.each<[string, () => unknown, string]>([
    ['wrong app', () => ({ ...backupPayloadFixture(), app: 'Other' }), 'UNSUPPORTED_APP'],
    [
      'unsupported version',
      () => ({ ...backupPayloadFixture(), schemaVersion: 2 }),
      'UNSUPPORTED_VERSION',
    ],
    [
      'missing collection',
      () => ({ ...backupPayloadFixture(), workLogs: undefined }),
      'INVALID_FORMAT',
    ],
    [
      'bad exportedAt',
      () => ({ ...backupPayloadFixture(), exportedAt: 'today' }),
      'INVALID_FIELD',
    ],
    [
      'bad Card status',
      () => ({
        ...backupPayloadFixture(),
        cards: [{ ...backupPayloadFixture().cards[0], status: 'CUSTOM' }],
      }),
      'INVALID_FIELD',
    ],
    [
      'bad Card priority',
      () => ({
        ...backupPayloadFixture(),
        cards: [{ ...backupPayloadFixture().cards[0], priority: 'URGENT' }],
      }),
      'INVALID_FIELD',
    ],
    [
      'bad due date',
      () => ({
        ...backupPayloadFixture(),
        cards: [{ ...backupPayloadFixture().cards[0], dueDate: '2026-02-30' }],
      }),
      'INVALID_FIELD',
    ],
    [
      'non-finite sort order',
      () => ({
        ...backupPayloadFixture(),
        cards: [{ ...backupPayloadFixture().cards[0], sortOrder: Infinity }],
      }),
      'INVALID_FIELD',
    ],
    [
      'DONE without completedAt',
      () => ({
        ...backupPayloadFixture(),
        cards: [{ ...backupPayloadFixture().cards[0], status: 'DONE' }],
      }),
      'INVALID_STATE',
    ],
    [
      'open Card with completedAt',
      () => ({
        ...backupPayloadFixture(),
        cards: [
          {
            ...backupPayloadFixture().cards[0],
            completedAt: '2026-09-08T01:00:00.000Z',
          },
        ],
      }),
      'INVALID_STATE',
    ],
    [
      'invalid classification color',
      () => ({
        ...backupPayloadFixture(),
        tags: [{ ...backupPayloadFixture().tags[0], color: '#ff0000' }],
      }),
      'INVALID_FIELD',
    ],
    [
      'duplicate Card ID',
      () => {
        const payload = backupPayloadFixture()
        return { ...payload, cards: [payload.cards[0], payload.cards[0]] }
      },
      'DUPLICATE_ID',
    ],
    [
      'duplicate Category ID',
      () => {
        const payload = backupPayloadFixture()
        return {
          ...payload,
          categories: [payload.categories[0], payload.categories[0]],
        }
      },
      'DUPLICATE_ID',
    ],
    [
      'duplicate Tag ID',
      () => {
        const payload = backupPayloadFixture()
        return { ...payload, tags: [payload.tags[0], payload.tags[0]] }
      },
      'DUPLICATE_ID',
    ],
    [
      'duplicate WorkLog ID',
      () => {
        const payload = backupPayloadFixture()
        return {
          ...payload,
          workLogs: [payload.workLogs[0], payload.workLogs[0]],
        }
      },
      'DUPLICATE_ID',
    ],
    [
      'duplicate CardTag',
      () => {
        const payload = backupPayloadFixture()
        return {
          ...payload,
          cardTags: [payload.cardTags[0], payload.cardTags[0]],
        }
      },
      'DUPLICATE_RELATION',
    ],
    [
      'missing Category reference',
      () => ({ ...backupPayloadFixture(), categories: [] }),
      'INVALID_REFERENCE',
    ],
    [
      'missing Tag reference',
      () => ({ ...backupPayloadFixture(), tags: [] }),
      'INVALID_REFERENCE',
    ],
    [
      'missing CardTag Card reference',
      () => ({ ...backupPayloadFixture(), cards: [] }),
      'INVALID_REFERENCE',
    ],
    [
      'orphan WorkLog',
      () => ({
        ...backupPayloadFixture(),
        workLogs: [
          { ...backupPayloadFixture().workLogs[0], cardId: 'missing' },
        ],
      }),
      'INVALID_REFERENCE',
    ],
    [
      'invalid final WorkLog',
      () => {
        const payload = backupPayloadFixture()
        return {
          ...payload,
          workLogs: [
            payload.workLogs[0],
            { ...payload.workLogs[0], id: 'log-last', content: '   ' },
          ],
        }
      },
      'INVALID_FIELD',
    ],
    [
      'invalid archived timestamp',
      () => ({
        ...backupPayloadFixture(),
        cards: [{ ...backupPayloadFixture().cards[0], archivedAt: 'later' }],
      }),
      'INVALID_FIELD',
    ],
    [
      'invalid Category name',
      () => ({
        ...backupPayloadFixture(),
        categories: [{ ...backupPayloadFixture().categories[0], name: ' ' }],
      }),
      'INVALID_FIELD',
    ],
  ])('rejects %s', (_name, value, code) => {
    try {
      prepareBackup(value())
      throw new Error('Expected backup validation to fail.')
    } catch (error) {
      expect(error).toBeInstanceOf(BackupValidationError)
      if (error instanceof BackupValidationError) expect(error.code).toBe(code)
    }
  })

  it('classifies invalid JSON without exposing its contents', () => {
    const privateText = '{private work content'
    expect(() => parseBackupJson(privateText)).toThrowError(
      expect.objectContaining({
        code: 'INVALID_JSON',
        message: 'This backup is not valid JSON.',
      }),
    )
    try {
      parseBackupJson(privateText)
    } catch (error) {
      expect(error).toBeInstanceOf(BackupValidationError)
      if (error instanceof Error)
        expect(error.message).not.toContain(privateText)
    }
  })

  it('returns detached safe objects and strips unknown fields', () => {
    const source: BackupPayload & { deviceTheme: string } = {
      ...backupPayloadFixture(),
      deviceTheme: 'dark',
    }
    const prepared = prepareBackup(source)
    source.cards[0].title = 'Mutated source'
    const firstCopy = prepared.toPayload()
    firstCopy.cards[0].title = 'Mutated result'

    expect(prepared.toPayload().cards[0].title).toBe('ERP issue')
    expect(prepared.toPayload()).not.toHaveProperty('deviceTheme')
  })
})
