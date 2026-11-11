import 'fake-indexeddb/auto'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { createDomainServices } from '@/services'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { installMatchMedia } from '@/test/match-media'

beforeEach(() => installMatchMedia(false))

afterEach(async () => {
  window.location.hash = ''
  await clearTestDatabases()
})

describe('Find, organize, and keyboard shortcuts', () => {
  it('supports plain-text search highlighting, combined filters, classification CRUD, and keyboard shortcuts', async () => {
    window.location.hash = '#/all'
    const database = await createTestDatabase('find-organize')
    const services = createDomainServices(database)

    const catWork = await services.classification.createCategory({
      name: 'Platform',
      color: 'indigo',
    })
    const tagUrgent = await services.classification.createTag({
      name: 'urgent',
      color: 'rose',
    })
    const cardA = await services.cards.create({
      title: 'Fix <script>alert(1)</script> escaping',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      categoryId: catWork.id,
      tagIds: [tagUrgent.id],
    })
    await services.workLogs.create({
      cardId: cardA.id,
      content: 'Verified DNS record rollout safely',
    })
    await services.cards.create({
      title: 'Write onboarding doc',
      status: 'TODO',
      priority: 'LOW',
    })

    const user = userEvent.setup()
    render(<App database={database} />)

    await screen.findByRole(
      'article',
      { name: cardA.title },
      { timeout: 3000 },
    )

    // Global shortcut '/' focuses search box
    await user.keyboard('/')
    const searchInput = screen.getByRole('combobox', { name: 'Search tasks' })
    expect(searchInput).toHaveFocus()

    // While focus is inside search input, typing 'n' searches rather than opening New Task dialog!
    await user.type(searchInput, '<script>')
    expect(
      screen.queryByRole('dialog', { name: 'New task' }),
    ).toBeNull()

    const listbox = await screen.findByRole('listbox', {
      name: 'Matching tasks',
    })
    expect(within(listbox).getByRole('option')).toHaveTextContent(
      'Fix <script>alert(1)</script> escaping',
    )
    expect(document.querySelector('script')).toBeNull()

    // Escape closes dropdown, second Escape clears search
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull()
    })
    await user.keyboard('{Escape}')
    expect(searchInput).toHaveValue('')

    // Filter via Sidebar category -> preserves cards on delete
    const sidebar = screen.getByRole('complementary')
    await user.click(
      within(sidebar).getByRole('button', { name: /^Platform \(/ }),
    )
    expect(
      screen.getByRole('article', { name: cardA.title }),
    ).toBeVisible()
    expect(screen.queryByText('Write onboarding doc')).toBeNull()

    // Deleting category via Sidebar edit modal keeps cards intact and clears stale filter
    await user.click(
      within(sidebar).getByRole('button', { name: 'Edit category Platform' }),
    )
    const editCategoryDialog = await screen.findByRole('dialog', {
      name: 'Edit category',
    })
    await user.click(
      within(editCategoryDialog).getByRole('button', { name: 'Delete' }),
    )
    const deleteConfirm = await screen.findByRole('dialog', {
      name: 'Delete category?',
    })
    expect(deleteConfirm).toHaveTextContent('1 linked task')
    await user.click(
      within(deleteConfirm).getByRole('button', { name: 'Delete category' }),
    )

    // After category deletion, active filter clears and both cards reappear!
    await waitFor(() => {
      expect(
        screen.getByRole('article', { name: 'Write onboarding doc' }),
      ).toBeVisible()
    })

    // Return focus outside input -> 'n' opens New task dialog; IME suppresses 'n'
    fireEvent.blur(searchInput)
    ;(document.activeElement as HTMLElement | null)?.blur()

    fireEvent.compositionStart(document.body)
    fireEvent.keyDown(document.body, { key: 'n', isComposing: true })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.compositionEnd(document.body)
    // Immediate keydown within 50ms of compositionend is suppressed for Safari WebKit IME safety
    await user.keyboard('n')
    expect(screen.queryByRole('dialog')).toBeNull()

    await new Promise((resolve) => setTimeout(resolve, 65))
    await user.keyboard('n')
    expect(await screen.findByRole('dialog', { name: 'New task' })).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })
})
