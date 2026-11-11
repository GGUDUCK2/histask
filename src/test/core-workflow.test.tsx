import 'fake-indexeddb/auto'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { installMatchMedia } from '@/test/match-media'

beforeEach(() => installMatchMedia(false))

afterEach(async () => {
  window.location.hash = ''
  await clearTestDatabases()
})

describe('Core WorkLog and Kanban workflow', () => {
  it('supports create -> move -> WorkLog CRUD -> preview recalculation -> done -> archive & delete', async () => {
    window.location.hash = '#/all'
    const database = await createTestDatabase('core-workflow')
    const user = userEvent.setup()
    render(<App database={database} />)

    expect(
      await screen.findByRole('heading', { name: 'All Tasks' }),
    ).toBeVisible()
    expect(await screen.findByText('No tasks yet')).toBeVisible()

    // Create task via top-right New task dialog
    await user.click(screen.getAllByRole('button', { name: 'New task' })[0])
    const dialog = await screen.findByRole('dialog')
    const titleInput = within(dialog).getByLabelText('Title')

    // Validation blocks empty submit
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Task title is required.',
    )

    // IME composing Enter does not submit prematurely
    fireEvent.compositionStart(titleInput)
    fireEvent.keyDown(titleInput, { key: 'Enter', isComposing: true })
    expect(await database.cards.count()).toBe(0)
    fireEvent.compositionEnd(titleInput)

    await user.type(titleInput, 'Prepare Cloudflare rollout')
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }))

    const cardArticle = await screen.findByRole('article', {
      name: 'Prepare Cloudflare rollout',
    })
    expect(within(cardArticle).getByText('No progress log yet')).toBeVisible()
    expect(screen.getByTestId('metric-total')).toHaveTextContent('1')
    expect(screen.getByTestId('metric-inProgress')).toHaveTextContent('0')

    // Move TODO -> IN_PROGRESS via non-drag Task actions menu
    await user.click(
      within(cardArticle).getByRole('button', {
        name: 'Task actions for Prepare Cloudflare rollout',
      }),
    )
    await user.click(await screen.findByRole('button', { name: 'In progress' }))

    await waitFor(() => {
      expect(screen.getByTestId('metric-inProgress')).toHaveTextContent('1')
    })

    // Open Card Detail Drawer once card is rendered in In progress column
    const inProgressColumn = await screen.findByRole(
      'region',
      { name: 'In progress (1)' },
      { timeout: 3000 },
    )
    await user.click(
      within(
        within(inProgressColumn).getByRole('article', {
          name: 'Prepare Cloudflare rollout',
        }),
      ).getByRole('button', { name: 'Prepare Cloudflare rollout' }),
    )

    const drawer = await screen.findByRole('dialog', {}, { timeout: 3000 })
    const composer = within(drawer).getByLabelText('Add WorkLog')

    // Enter preserves newline; Ctrl+Enter saves once; IME blocks shortcut
    await user.type(composer, 'Line 1 check')
    await user.keyboard('{Enter}')
    await user.type(composer, 'Line 2 verified')

    fireEvent.compositionStart(composer)
    fireEvent.keyDown(composer, {
      key: 'Enter',
      ctrlKey: true,
      isComposing: true,
    })
    expect(await database.workLogs.count()).toBe(0)
    fireEvent.compositionEnd(composer)

    await user.click(within(drawer).getByRole('button', { name: 'Save WorkLog' }))

    const historyList = await within(drawer).findByRole('list', {
      name: 'WorkLog history',
    })
    expect(within(historyList).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByTestId('metric-updatedToday')).toHaveTextContent('1')

    // Add second newer log with Ctrl+Enter after small delay for deterministic ordering
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    await user.type(composer, 'Uploaded staging bundle')
    fireEvent.keyDown(composer, { key: 'Enter', ctrlKey: true })

    await waitFor(() => {
      expect(within(historyList).getAllByRole('listitem')).toHaveLength(2)
    })

    const itemsNewestFirst = within(historyList).getAllByRole('listitem')
    expect(itemsNewestFirst[0]).toHaveTextContent('Uploaded staging bundle')
    expect(itemsNewestFirst[0]).toHaveTextContent('Latest')
    expect(itemsNewestFirst[1]).toHaveTextContent('Line 2 verified')

    // Close drawer and check latest preview on Kanban card
    await user.click(within(drawer).getByRole('button', { name: 'Close' }))

    const updatedCard = await screen.findByRole('article', {
      name: 'Prepare Cloudflare rollout',
    })
    expect(updatedCard).toHaveTextContent('Uploaded staging bundle')
    expect(updatedCard).toHaveTextContent('2')

    // Reopen drawer -> edit older log & confirm latest card preview stays newest
    await user.click(
      within(updatedCard).getByRole('button', {
        name: 'Prepare Cloudflare rollout',
      }),
    )
    const reopenedDrawer = await screen.findByRole('dialog')
    const editButtons = within(reopenedDrawer).getAllByRole('button', {
      name: 'Edit WorkLog',
    })
    // Index 1 is the older WorkLog
    await user.click(editButtons[1])
    const editArea = within(reopenedDrawer).getByLabelText('Edit WorkLog content')
    await user.clear(editArea)
    await user.type(editArea, 'Line 1 updated note')
    await user.click(within(reopenedDrawer).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(reopenedDrawer).toHaveTextContent('(edited)')
    })
    // Latest log must remain index 0
    const reorderedItems = within(
      within(reopenedDrawer).getByRole('list', { name: 'WorkLog history' }),
    ).getAllByRole('listitem')
    expect(reorderedItems[0]).toHaveTextContent('Uploaded staging bundle')
    expect(reorderedItems[1]).toHaveTextContent('Line 1 updated note')

    // Delete latest log with confirmation -> preview reverts cleanly to older log
    const deleteButtons = within(reopenedDrawer).getAllByRole('button', {
      name: 'Delete WorkLog',
    })
    await user.click(deleteButtons[0])
    const confirmDeleteLog = await screen.findByRole('dialog', {
      name: 'Delete WorkLog?',
    })
    await user.click(
      within(confirmDeleteLog).getByRole('button', { name: 'Cancel' }),
    )
    expect(reopenedDrawer).toHaveTextContent('Uploaded staging bundle')

    await user.click(
      within(reopenedDrawer).getAllByRole('button', { name: 'Delete WorkLog' })[0],
    )
    const confirmDeleteAgain = await screen.findByRole('dialog', {
      name: 'Delete WorkLog?',
    })
    await user.click(
      within(confirmDeleteAgain).getByRole('button', {
        name: 'Delete WorkLog',
      }),
    )

    await waitFor(() => {
      expect(
        within(reopenedDrawer)
          .getByRole('list', { name: 'WorkLog history' })
          .querySelectorAll('li'),
      ).toHaveLength(1)
    })

    // Close drawer -> card preview is now 'Line 1 updated note'
    await user.click(within(reopenedDrawer).getByRole('button', { name: 'Close' }))
    const cardAfterLogDelete = await screen.findByRole('article', {
      name: 'Prepare Cloudflare rollout',
    })
    expect(cardAfterLogDelete).toHaveTextContent('Line 1 updated note')
    expect(cardAfterLogDelete).not.toHaveTextContent('Uploaded staging bundle')

    // Move to DONE -> Done metric = 1 & In Progress = 0
    await user.click(
      within(cardAfterLogDelete).getByRole('button', {
        name: 'Task actions for Prepare Cloudflare rollout',
      }),
    )
    await user.click(await screen.findByRole('button', { name: 'Done' }))
    await waitFor(() => {
      expect(screen.getByTestId('metric-done')).toHaveTextContent('1')
      expect(screen.getByTestId('metric-inProgress')).toHaveTextContent('0')
    })

    // Open drawer inside Done column -> Archive task (removes from board, retains DB record with archivedAt)
    const doneColumn = await screen.findByRole('region', {
      name: 'Done (1)',
    })
    await user.click(
      within(
        within(doneColumn).getByRole('article', {
          name: 'Prepare Cloudflare rollout',
        }),
      ).getByRole('button', { name: 'Prepare Cloudflare rollout' }),
    )
    const doneDrawer = await screen.findByRole('dialog')
    await user.click(within(doneDrawer).getByRole('button', { name: 'Archive' }))
    const archiveConfirm = await screen.findByRole('dialog', {
      name: 'Archive task?',
    })
    await user.click(
      within(archiveConfirm).getByRole('button', { name: 'Archive task' }),
    )

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeVisible()
    })
    const archivedRows = await database.cards.toArray()
    expect(archivedRows).toHaveLength(1)
    expect(archivedRows[0].archivedAt).toBeDefined()
  })

  it('rolls back failed board move cleanly without corrupting stored order', async () => {
    window.location.hash = '#/all'
    const database = await createTestDatabase('core-rollback')
    await database.cards.add({
      id: 'card-fail',
      title: 'Persistent card',
      status: 'TODO',
      priority: 'NONE',
      sortOrder: 0,
      createdAt: '2026-09-08T01:00:00.000Z',
      updatedAt: '2026-09-08T01:00:00.000Z',
    })

    const user = userEvent.setup()
    render(<App database={database} />)
    const card = await screen.findByRole('article', { name: 'Persistent card' })

    const putSpy = vi
      .spyOn(database.cards, 'bulkPut')
      .mockRejectedValueOnce(new Error('disk full'))

    await user.click(
      within(card).getByRole('button', {
        name: 'Task actions for Persistent card',
      }),
    )
    await user.click(await screen.findByRole('button', { name: 'Done' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save the new task order or status locally.',
    )
    expect((await database.cards.get('card-fail'))?.status).toBe('TODO')

    putSpy.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(async () => {
      expect((await database.cards.get('card-fail'))?.status).toBe('DONE')
    })
  })
})
