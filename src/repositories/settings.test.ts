import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeHistaskDatabase, HistaskDatabase } from '@/db/database'
import {
  clearTestDatabases,
  createTestDatabase,
  testDatabaseName,
  trackTestDatabase,
} from '@/test/database'
import { DexieSettingsRepository } from './settings'

afterEach(clearTestDatabases)

describe('DexieSettingsRepository', () => {
  it('defaults missing or invalid theme settings to System', async () => {
    const database = await createTestDatabase('settings-default')
    const repository = new DexieSettingsRepository(database)

    await expect(repository.getTheme()).resolves.toBe('system')
    await database.settings.put({ key: 'theme', value: 'sepia' })
    await expect(repository.getTheme()).resolves.toBe('system')
  })

  it('persists a theme across database reopen', async () => {
    const name = testDatabaseName('settings-reopen')
    const first = trackTestDatabase(new HistaskDatabase(name))
    await first.open()
    await new DexieSettingsRepository(first).setTheme('dark')
    closeHistaskDatabase(first)

    const reopened = trackTestDatabase(new HistaskDatabase(name))
    await reopened.open()
    await expect(new DexieSettingsRepository(reopened).getTheme()).resolves.toBe(
      'dark',
    )
  })

  it('emits reactive theme changes', async () => {
    const database = await createTestDatabase('settings-observe')
    const repository = new DexieSettingsRepository(database)
    const listener = vi.fn()
    const unsubscribe = repository.observeTheme().subscribe(listener, vi.fn())

    await repository.setTheme('light')
    await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith('light'))
    unsubscribe()
  })

  it('returns a structured error when the database cannot be read', async () => {
    const database = await createTestDatabase('settings-read-error')
    database.close({ disableAutoOpen: true })

    await expect(
      new DexieSettingsRepository(database).getTheme(),
    ).rejects.toMatchObject({ code: 'READ_FAILED' })
  })
})
