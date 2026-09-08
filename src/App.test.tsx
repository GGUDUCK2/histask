import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { HistaskDatabase } from '@/db/database'
import {
  clearTestDatabases,
  createTestDatabase,
  testDatabaseName,
  trackTestDatabase,
} from '@/test/database'
import { installMatchMedia } from '@/test/match-media'

beforeEach(() => installMatchMedia(false))

afterEach(async () => {
  window.location.hash = ''
  await clearTestDatabases()
})

describe('application entry and routing', () => {
  it('opens at All Tasks and navigates with active route semantics and history', async () => {
    window.location.hash = '#/all'
    const database = await createTestDatabase('app-routing')
    const user = userEvent.setup()
    render(<App database={database} />)

    expect(await screen.findByRole('heading', { name: 'All Tasks' })).toBeVisible()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    const allTasks = within(primary).getByRole('link', { name: 'All Tasks' })
    expect(allTasks).toHaveAttribute('aria-current', 'page')
    expect(within(primary).getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Search tasks' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'New task' })).toBeDisabled()

    await user.click(within(primary).getByRole('link', { name: 'Waiting' }))
    expect(await screen.findByRole('heading', { name: 'Waiting' })).toBeVisible()
    expect(
      within(primary).getByRole('link', { name: 'Waiting' }),
    ).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('link', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeVisible()
    act(() => window.history.back())
    expect(await screen.findByRole('heading', { name: 'Waiting' })).toBeVisible()
  })

  it('restores a hash route on a new application mount', async () => {
    window.location.hash = '#/completed'
    const database = await createTestDatabase('app-refresh')
    render(<App database={database} />)

    expect(await screen.findByRole('heading', { name: 'Completed' })).toBeVisible()
    expect(
      screen.getByRole('navigation', { name: 'Primary' }).querySelector(
        '[aria-current="page"]',
      ),
    ).toHaveTextContent('Completed')
  })

  it('shows a recoverable database error and retries without deleting data', async () => {
    const database = trackTestDatabase(
      new HistaskDatabase(testDatabaseName('app-open-error')),
    )
    vi.spyOn(database, 'open').mockRejectedValueOnce(
      new Error('temporarily unavailable'),
    )
    const deleteSpy = vi.spyOn(Dexie, 'delete')
    const user = userEvent.setup()
    render(<App database={database} />)

    expect(
      await screen.findByRole('heading', {
        name: 'Could not open local Histask data',
      }),
    ).toBeVisible()
    expect(deleteSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'All Tasks' })).toBeVisible()
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('traps focus in mobile navigation and returns it to the opener', async () => {
    const database = await createTestDatabase('app-mobile-navigation')
    const user = userEvent.setup()
    render(<App database={database} />)
    await screen.findByRole('heading', { name: 'All Tasks' })
    const opener = screen.getByRole('button', { name: 'Open navigation' })

    await user.click(opener)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(opener).toHaveFocus()
  })
})
