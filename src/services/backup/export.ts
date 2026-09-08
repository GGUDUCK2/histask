import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import {
  BACKUP_APP,
  BACKUP_MIME_TYPE,
  BACKUP_SCHEMA_VERSION,
  type BackupExport,
  type BackupPayload,
} from '@/types/backup'
import { toLocalDateKey } from '@/utils/dates'
import {
  defaultServiceContext,
  type ServiceContext,
} from '../service-context'
import { requireTimestamp } from '../validation'
import { prepareBackup } from './prepare'

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id)
}

export class BackupExportService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner
  private readonly context: Pick<ServiceContext, 'now'>

  constructor(
    database: HistaskDatabase,
    context: Pick<ServiceContext, 'now'> = defaultServiceContext,
  ) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
    this.context = context
  }

  async export(): Promise<BackupExport> {
    const now = this.context.now()
    const exportedAt = requireTimestamp(now.toISOString(), 'exportedAt')
    const snapshot = await this.transactions.read(
      ['cards', 'categories', 'tags', 'cardTags', 'workLogs'],
      async () => {
        const [categories, tags, cardTags, cards, workLogs] =
          await Promise.all([
            this.database.categories.toArray(),
            this.database.tags.toArray(),
            this.database.cardTags.toArray(),
            this.database.cards.toArray(),
            this.database.workLogs.toArray(),
          ])
        return { categories, tags, cardTags, cards, workLogs }
      },
    )
    const candidate: BackupPayload = {
      app: BACKUP_APP,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt,
      categories: snapshot.categories.sort(byId),
      tags: snapshot.tags.sort(byId),
      cardTags: snapshot.cardTags.sort(
        (left, right) =>
          left.cardId.localeCompare(right.cardId) ||
          left.tagId.localeCompare(right.tagId),
      ),
      cards: snapshot.cards.sort(byId),
      workLogs: snapshot.workLogs.sort(byId),
    }
    const payload = prepareBackup(candidate).toPayload()
    return {
      filename: `histask-backup-${toLocalDateKey(now)}.json`,
      mimeType: BACKUP_MIME_TYPE,
      json: JSON.stringify(payload, null, 2),
      payload,
    }
  }
}
