import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/app/ThemeProvider'
import type { HistaskDatabase } from '@/db/database'
import { DexieSettingsRepository } from '@/repositories/settings'
import { BackupExportService, BackupImportService } from '@/services/backup'
import { StoragePersistenceService } from '@/services/storage-status'
import { backupPayloadFixture } from '@/test/backup-fixtures'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { cardFixture, workLogFixture } from '@/test/domain-fixtures'
import { installMatchMedia } from '@/test/match-media'
import { BackupControls } from './BackupControls'
import { SettingsPage } from './SettingsPage'
import { StorageStatus } from './StorageStatus'

afterEach(clearTestDatabases)

function renderSettings(database: HistaskDatabase) {
  installMatchMedia(false)
  return render(
    <ThemeProvider repository={new DexieSettingsRepository(database)}>
      <SettingsPage database={database} />
    </ThemeProvider>,
  )
}

describe('Settings', () => {
  it('shows storage states and requests persistence when available', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    const service = new StoragePersistenceService({
      persisted: vi.fn().mockResolvedValue(false),
      persist,
    })
    const user = userEvent.setup()
    render(<StorageStatus service={service} />)

    expect(
      await screen.findByText('Data is local, but the browser may reclaim its storage.'),
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Request persistence' }),
    )
    expect(persist).toHaveBeenCalledOnce()
    expect(
      await screen.findByText(
        'This browser reports that Histask storage is persistent.',
      ),
    ).toBeVisible()
  })

  it('persists theme choices and reports local application details', async () => {
    const database = await createTestDatabase('settings-page')
    const user = userEvent.setup()
    renderSettings(database)

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    await waitFor(async () =>
      expect(await database.settings.get('theme')).toEqual({
        key: 'theme',
        value: 'dark',
      }),
    )
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByText('IndexedDB')).toBeVisible()
    expect(screen.getByText('Database schema')).toBeVisible()
    expect(screen.getByText('1')).toBeVisible()
  })

  it('exports through a local object URL and releases it', async () => {
    const database = await createTestDatabase('settings-export')
    await database.cards.add(cardFixture({ id: 'export-card' }))
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:histask-backup')
    const revokeObjectURL = vi.fn()
    let downloadedFilename = ''
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedFilename = this.download
      })
    const user = userEvent.setup()
    render(
      <BackupControls
        exportService={new BackupExportService(database)}
        importService={new BackupImportService(database)}
        runMutation={async (operation) => {
          await operation()
          return true
        }}
        writePending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createObjectURL.mock.calls[0]?.[0]).toMatchObject({
      type: 'application/json',
    })
    expect(downloadedFilename).toMatch(/^histask-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:histask-backup')
    expect(await screen.findByRole('status')).toHaveTextContent(
      /^Saved histask-backup-/,
    )
  })

  it('validates an import before confirmation and preserves settings on replace', async () => {
    const database = await createTestDatabase('settings-import')
    await database.cards.add(cardFixture({ id: 'old-card' }))
    await database.settings.put({ key: 'theme', value: 'light' })
    const user = userEvent.setup()
    render(
      <BackupControls
        exportService={new BackupExportService(database)}
        importService={new BackupImportService(database)}
        runMutation={async (operation) => {
          await operation()
          return true
        }}
        writePending={false}
      />,
    )
    const file = new File(
      [JSON.stringify(backupPayloadFixture())],
      'valid-backup.json',
      { type: 'application/json' },
    )
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(JSON.stringify(backupPayloadFixture())),
    })

    await user.upload(screen.getByLabelText('Import backup'), file)
    expect(await screen.findByText(/valid and ready for review/)).toBeVisible()
    expect((await database.cards.toArray()).map(({ id }) => id)).toEqual([
      'old-card',
    ])
    await user.click(screen.getByRole('button', { name: 'Review' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Replace existing data?')).toBeVisible()
    expect(within(dialog).getAllByText('1', { selector: 'dd' })).toHaveLength(5)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect((await database.cards.toArray()).map(({ id }) => id)).toEqual([
      'old-card',
    ])
    expect(screen.getByRole('button', { name: 'Review' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Review' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Replace data',
      }),
    )

    await waitFor(async () =>
      expect((await database.cards.toArray()).map(({ id }) => id)).toEqual([
        'card-1',
      ]),
    )
    expect(await database.settings.get('theme')).toEqual({
      key: 'theme',
      value: 'light',
    })
  })

  it('shows local file read and replace failures without changing current data', async () => {
    const database = await createTestDatabase('settings-import-failures')
    await database.cards.add(cardFixture({ id: 'kept-card' }))
    const importService = new BackupImportService(database)
    vi.spyOn(importService, 'replace').mockRejectedValue(
      new Error('quota unavailable'),
    )
    const user = userEvent.setup()
    render(
      <BackupControls
        exportService={new BackupExportService(database)}
        importService={importService}
        runMutation={async (operation) => {
          await operation()
          return true
        }}
        writePending={false}
      />,
    )
    const unreadable = new File([''], 'unreadable.json')
    Object.defineProperty(unreadable, 'text', {
      value: () => Promise.reject(new Error('read failed')),
    })

    await user.upload(screen.getByLabelText('Import backup'), unreadable)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not read this backup file.',
    )

    const valid = new File([''], 'valid.json')
    Object.defineProperty(valid, 'text', {
      value: () => Promise.resolve(JSON.stringify(backupPayloadFixture())),
    })
    await user.upload(screen.getByLabelText('Import backup'), valid)
    await user.click(await screen.findByRole('button', { name: 'Review' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Replace data',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your previous data is unchanged.',
    )
    expect((await database.cards.toArray()).map(({ id }) => id)).toEqual([
      'kept-card',
    ])
  })

  it('rejects invalid import content without touching existing data', async () => {
    const database = await createTestDatabase('settings-invalid-import')
    await database.cards.add(cardFixture({ id: 'kept-card' }))
    const user = userEvent.setup()
    render(
      <BackupControls
        exportService={new BackupExportService(database)}
        importService={new BackupImportService(database)}
        runMutation={async (operation) => {
          await operation()
          return true
        }}
        writePending={false}
      />,
    )
    const file = new File(['{"schemaVersion":999}'], 'invalid.json')
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve('{"schemaVersion":999}'),
    })

    await user.upload(screen.getByLabelText('Import backup'), file)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No existing Histask data was changed.',
    )
    expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled()
    expect((await database.cards.toArray()).map(({ id }) => id)).toEqual([
      'kept-card',
    ])
  })

  it('requires exact DELETE and clears every table plus local settings', async () => {
    const database = await createTestDatabase('settings-delete-all')
    await database.cards.add(cardFixture({ id: 'delete-card' }))
    await database.workLogs.add(
      workLogFixture({ id: 'delete-log', cardId: 'delete-card' }),
    )
    await database.settings.put({ key: 'theme', value: 'dark' })
    const user = userEvent.setup()
    renderSettings(database)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )

    const trigger = screen.getByRole('button', { name: 'Delete…' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog')
    const confirm = within(dialog).getByRole('button', {
      name: 'Delete all data',
    })
    await user.type(within(dialog).getByLabelText('Type DELETE to confirm'), 'delete')
    expect(confirm).toBeDisabled()
    await user.clear(within(dialog).getByLabelText('Type DELETE to confirm'))
    await user.type(within(dialog).getByLabelText('Type DELETE to confirm'), 'DELETE')
    expect(confirm).toBeEnabled()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(await database.cards.count()).toBe(1)
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    await user.type(
      within(screen.getByRole('dialog')).getByLabelText('Type DELETE to confirm'),
      'DELETE',
    )
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete all data',
      }),
    )

    expect(await screen.findByText('All local Histask data was deleted.')).toBeVisible()
    await waitFor(async () => {
      expect(await database.cards.count()).toBe(0)
      expect(await database.workLogs.count()).toBe(0)
      expect(await database.settings.count()).toBe(0)
    })
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(trigger).toHaveFocus()
  })
})
