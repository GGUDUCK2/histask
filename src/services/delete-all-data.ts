import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'

export class DeleteAllDataService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner

  constructor(database: HistaskDatabase) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
  }

  async deleteAll(): Promise<void> {
    await this.transactions.write(
      ['cards', 'categories', 'tags', 'cardTags', 'workLogs', 'settings'],
      async () => {
        await this.database.cardTags.clear()
        await this.database.workLogs.clear()
        await this.database.cards.clear()
        await this.database.categories.clear()
        await this.database.tags.clear()
        await this.database.settings.clear()
      },
    )
  }
}
