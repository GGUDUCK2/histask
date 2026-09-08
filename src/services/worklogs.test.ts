import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { DomainError } from '@/services/domain-errors'
import { ValidationError } from '@/services/validation'
import {
  clearTestDatabases,
  createTestDatabase,
} from '@/test/database'
import { cardFixture, workLogFixture } from '@/test/domain-fixtures'
import { TestServiceContext } from '@/test/service-context'
import { WorkLogService } from './worklogs'

afterEach(clearTestDatabases)

describe('WorkLogService', () => {
  it('creates a first-class WorkLog and touches its parent atomically', async () => {
    const database = await createTestDatabase('worklog-create')
    const context = new TestServiceContext(
      '2026-09-08T01:00:00.000Z',
      ['log-1'],
    )
    const service = new WorkLogService(database, context)
    await database.cards.add(cardFixture({ id: 'card-1' }))

    const log = await service.create({
      cardId: 'card-1',
      content: 'SQL 수정\n회귀 테스트 완료',
    })

    expect(log).toEqual({
      id: 'log-1',
      cardId: 'card-1',
      content: 'SQL 수정\n회귀 테스트 완료',
      createdAt: '2026-09-08T01:00:00.000Z',
      updatedAt: '2026-09-08T01:00:00.000Z',
    })
    expect((await database.cards.get('card-1'))?.updatedAt).toBe(
      '2026-09-08T01:00:00.000Z',
    )
  })

  it('rejects blank content and logs for a missing Card', async () => {
    const database = await createTestDatabase('worklog-validation')
    const service = new WorkLogService(
      database,
      new TestServiceContext('2026-09-08T01:00:00.000Z', ['log-1']),
    )

    await expect(
      service.create({ cardId: 'missing', content: 'Progress' }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      entity: 'Card',
    } satisfies Partial<DomainError>)
    await expect(
      service.create({ cardId: 'missing', content: '  ' }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(await database.workLogs.count()).toBe(0)
  })

  it('rolls back insertion if the parent timestamp cannot be saved', async () => {
    const database = await createTestDatabase('worklog-create-rollback')
    const service = new WorkLogService(
      database,
      new TestServiceContext('2026-09-08T01:00:00.000Z', ['log-1']),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    database.cards.hook('updating', () => {
      throw new Error('parent update failed')
    })

    await expect(
      service.create({ cardId: 'card-1', content: 'Progress' }),
    ).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })
    expect(await database.workLogs.count()).toBe(0)
    expect((await database.cards.get('card-1'))?.updatedAt).toBe(
      '2026-09-08T00:00:00.000Z',
    )
  })

  it('orders newest first with a stable ID tie-break', async () => {
    const database = await createTestDatabase('worklog-order')
    const service = new WorkLogService(
      database,
      new TestServiceContext('2026-09-08T01:00:00.000Z'),
    )
    await database.workLogs.bulkAdd([
      workLogFixture({
        id: 'log-a',
        createdAt: '2026-09-08T01:00:00.000Z',
      }),
      workLogFixture({
        id: 'log-b',
        createdAt: '2026-09-08T02:00:00.000Z',
      }),
      workLogFixture({
        id: 'log-c',
        createdAt: '2026-09-08T02:00:00.000Z',
      }),
    ])

    expect((await service.listForCard('card-1')).map(({ id }) => id)).toEqual([
      'log-c',
      'log-b',
      'log-a',
    ])
    await expect(service.getSummary('card-1')).resolves.toMatchObject({
      latest: { id: 'log-c' },
      count: 3,
    })
  })

  it('edits content without changing chronology and touches the Card', async () => {
    const database = await createTestDatabase('worklog-edit')
    const context = new TestServiceContext('2026-09-08T05:00:00.000Z')
    const service = new WorkLogService(database, context)
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.workLogs.bulkAdd([
      workLogFixture({
        id: 'old',
        content: 'Old text',
        createdAt: '2026-09-08T01:00:00.000Z',
      }),
      workLogFixture({
        id: 'latest',
        createdAt: '2026-09-08T02:00:00.000Z',
      }),
    ])

    const editedLatest = await service.update('latest', 'Edited latest entry')
    expect(editedLatest.createdAt).toBe('2026-09-08T02:00:00.000Z')
    expect((await service.getSummary('card-1')).latest).toMatchObject({
      id: 'latest',
      content: 'Edited latest entry',
    })

    context.setNow('2026-09-08T06:00:00.000Z')
    const edited = await service.update('old', 'Edited historical entry')

    expect(edited).toMatchObject({
      content: 'Edited historical entry',
      createdAt: '2026-09-08T01:00:00.000Z',
      updatedAt: '2026-09-08T06:00:00.000Z',
    })
    expect((await service.getSummary('card-1')).latest?.id).toBe('latest')
    expect((await database.cards.get('card-1'))?.updatedAt).toBe(
      '2026-09-08T06:00:00.000Z',
    )
  })

  it('recalculates latest and count after latest and final deletions', async () => {
    const database = await createTestDatabase('worklog-delete')
    const context = new TestServiceContext('2026-09-08T05:00:00.000Z')
    const service = new WorkLogService(database, context)
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.workLogs.bulkAdd([
      workLogFixture({
        id: 'old',
        createdAt: '2026-09-08T01:00:00.000Z',
      }),
      workLogFixture({
        id: 'latest',
        createdAt: '2026-09-08T02:00:00.000Z',
      }),
    ])

    await service.delete('latest')
    expect(await service.getSummary('card-1')).toMatchObject({
      latest: { id: 'old' },
      count: 1,
    })
    context.setNow('2026-09-08T06:00:00.000Z')
    await service.delete('old')
    expect(await service.getSummary('card-1')).toEqual({
      latest: undefined,
      count: 0,
    })
    expect((await database.cards.get('card-1'))?.updatedAt).toBe(
      '2026-09-08T06:00:00.000Z',
    )
  })

  it('rolls back an edit when the parent Card update fails', async () => {
    const database = await createTestDatabase('worklog-edit-rollback')
    const service = new WorkLogService(
      database,
      new TestServiceContext('2026-09-08T05:00:00.000Z'),
    )
    await database.cards.add(cardFixture({ id: 'card-1' }))
    await database.workLogs.add(
      workLogFixture({ id: 'log-1', content: 'Original' }),
    )
    database.cards.hook('updating', () => {
      throw new Error('parent update failed')
    })

    await expect(service.update('log-1', 'Changed')).rejects.toMatchObject({
      code: 'TRANSACTION_FAILED',
    })
    expect((await database.workLogs.get('log-1'))?.content).toBe('Original')
  })
})
