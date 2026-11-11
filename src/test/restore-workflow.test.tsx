import 'fake-indexeddb/auto'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import {
  createDomainServices,
  parseBackupJson,
  prepareBackup,
  validateBackupPayload,
} from '@/services'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { installMatchMedia } from '@/test/match-media'

beforeEach(() => installMatchMedia(false))

afterEach(async () => {
  window.location.hash = ''
  await clearTestDatabases()
})

describe('Backup restore regression workflow', () => {
  it('closes stale drawers and displays restored cards, latest WorkLogs, and metrics', async () => {
    window.location.hash = '#/all'
    const database = await createTestDatabase('restore-workflow')
    const services = createDomainServices(database)

    const originalCard = await services.cards.create({
      title: 'Original Dataset Card',
      status: 'IN_PROGRESS',
    })
    await services.workLogs.create({
      cardId: originalCard.id,
      content: 'Original progress item',
    })

    const exported = await services.backupExport.export()

    // Mutate workspace to a temporary stale state before restoring original snapshot
    await services.cards.deletePermanently(originalCard.id)
    const staleCard = await services.cards.create({
      title: 'Stale Temporary Task',
      status: 'TODO',
    })
    await services.workLogs.create({
      cardId: staleCard.id,
      content: 'Stale log entry',
    })

    const user = userEvent.setup()
    render(<App database={database} />)

    // Open stale card drawer before restore happens
    const staleArticle = await screen.findByRole('article', {
      name: 'Stale Temporary Task',
    })
    await user.click(
      within(staleArticle).getByRole('button', {
        name: 'Stale Temporary Task',
      }),
    )
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Stale log entry',
    )

    // Restore original snapshot through real BackupImportService while UI is mounted
    const parsed = parseBackupJson(exported.json)
    const validated = validateBackupPayload(parsed)
    const prepared = prepareBackup(validated)
    await services.backupImport.replace(prepared)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(screen.queryByText('Stale Temporary Task')).toBeNull()
    })

    const restoredCard = await screen.findByRole('article', {
      name: 'Original Dataset Card',
    })
    expect(restoredCard).toHaveTextContent('Original progress item')
    expect(screen.getByTestId('metric-inProgress')).toHaveTextContent('1')
    expect(screen.getByTestId('metric-total')).toHaveTextContent('1')
  })
})
