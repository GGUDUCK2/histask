import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import type { BackupCollectionCounts } from '@/types/backup'
import { BackupValidationError } from './errors'
import { isPreparedBackup, type PreparedBackup } from './prepare'

export class BackupImportService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner

  constructor(database: HistaskDatabase) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
  }

  async replace(prepared: PreparedBackup): Promise<BackupCollectionCounts> {
    if (!isPreparedBackup(prepared))
      throw new BackupValidationError('INVALID_FORMAT')
    const payload = prepared.toPayload()
    await this.transactions.write(
      ['cards', 'categories', 'tags', 'cardTags', 'workLogs'],
      async () => {
        await this.database.cardTags.clear()
        await this.database.workLogs.clear()
        await this.database.cards.clear()
        await this.database.categories.clear()
        await this.database.tags.clear()

        if (payload.categories.length > 0)
          await this.database.categories.bulkAdd(payload.categories)
        if (payload.tags.length > 0)
          await this.database.tags.bulkAdd(payload.tags)
        if (payload.cards.length > 0)
          await this.database.cards.bulkAdd(payload.cards)
        if (payload.cardTags.length > 0)
          await this.database.cardTags.bulkAdd(payload.cardTags)
        if (payload.workLogs.length > 0)
          await this.database.workLogs.bulkAdd(payload.workLogs)
      },
    )
    return { ...prepared.counts }
  }
}
