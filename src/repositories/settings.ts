import type { HistaskDatabase } from '@/db/database'
import { toDataError } from '@/services/data-errors'
import {
  isLanguage,
  isTheme,
  type Language,
  type Theme,
} from '@/types/settings'
import { createRepositoryQuery, type RepositoryQuery } from './query'
import { HistaskTransactionRunner } from './transactions'

export interface ThemePreferenceRepository {
  getTheme(): Promise<Theme>
  setTheme(theme: Theme): Promise<void>
  observeTheme(): RepositoryQuery<Theme>
}

export interface LanguagePreferenceRepository {
  getLanguage(): Promise<Language>
  setLanguage(language: Language): Promise<void>
  observeLanguage(): RepositoryQuery<Language>
}

export interface SettingsRepository
  extends ThemePreferenceRepository,
    LanguagePreferenceRepository {}

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

  async getLanguage(): Promise<Language> {
    try {
      const setting = await this.database.settings.get('language')
      return isLanguage(setting?.value) ? setting.value : 'system'
    } catch (error) {
      throw toDataError(error, 'READ_FAILED', 'read language preference')
    }
  }

  async setLanguage(language: Language): Promise<void> {
    await this.transactions.write(['settings'], async () => {
      await this.database.settings.put({ key: 'language', value: language })
    })
  }

  observeLanguage(): RepositoryQuery<Language> {
    return createRepositoryQuery('observe language preference', () =>
      this.getLanguage(),
    )
  }
}
