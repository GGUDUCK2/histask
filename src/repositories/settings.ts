import type { HistaskDatabase } from '@/db/database'
import { toDataError } from '@/services/data-errors'
import { isTheme, type Theme } from '@/types/settings'
import { createRepositoryQuery, type RepositoryQuery } from './query'
import { HistaskTransactionRunner } from './transactions'

export interface SettingsRepository {
  getTheme(): Promise<Theme>
  setTheme(theme: Theme): Promise<void>
  observeTheme(): RepositoryQuery<Theme>
}

export class DexieSettingsRepository implements SettingsRepository {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner

  constructor(database: HistaskDatabase) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
  }

  async getTheme(): Promise<Theme> {
    try {
      const setting = await this.database.settings.get('theme')
      return isTheme(setting?.value) ? setting.value : 'system'
    } catch (error) {
      throw toDataError(error, 'READ_FAILED', 'read theme preference')
    }
  }

  async setTheme(theme: Theme): Promise<void> {
    await this.transactions.write(['settings'], async () => {
      await this.database.settings.put({ key: 'theme', value: theme })
    })
  }

  observeTheme(): RepositoryQuery<Theme> {
    return createRepositoryQuery('observe theme preference', () =>
      this.getTheme(),
    )
  }
}
