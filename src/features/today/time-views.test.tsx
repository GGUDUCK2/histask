import 'fake-indexeddb/auto'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { createDomainServices } from '@/services'
import { clearTestDatabases, createTestDatabase } from '@/test/database'
import { installMatchMedia } from '@/test/match-media'
import { toLocalDateKey } from '@/utils/dates'

beforeEach(() => installMatchMedia(false))

afterEach(async () => {
  window.location.hash = ''
  await clearTestDatabases()
})

describe('Today view and Mini Calendar', () => {
  it('displays Today sections without duplicates and navigates Mini Calendar date views', async () => {
    window.location.hash = '#/today'
    const database = await createTestDatabase('time-views')
    const services = createDomainServices(database)

    const today = new Date()
    const todayKey = toLocalDateKey(today)

    await services.cards.create({
      title: 'Due today card',
      status: 'TODO',
      dueDate: todayKey,
    })

    const loggedCard = await services.cards.create({
      title: 'Active log card',
      status: 'IN_PROGRESS',
    })
    await services.workLogs.create({
      cardId: loggedCard.id,
      content: 'First entry today',
    })
    await services.workLogs.create({
      cardId: loggedCard.id,
      content: 'Second latest entry today',
    })

    await services.cards.create({
      title: 'Completed today card',
      status: 'DONE',
    })

    const user = userEvent.setup()
    render(<App database={database} />)

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible()

    const dueSection = await screen.findByRole('region', {
      name: /Due Today \(1\)/,
    })
    expect(within(dueSection).getByText('Due today card')).toBeVisible()

    const updatedSection = screen.getByRole('region', {
      name: /Updated Today \(1\)/,
    })
    expect(within(updatedSection).getAllByRole('button')).toHaveLength(1)
    expect(updatedSection).toHaveTextContent('Second latest entry today')
    expect(updatedSection).toHaveTextContent('2 logs today')

    const completedSection = screen.getByRole('region', {
      name: /Completed Today \(1\)/,
    })
    expect(within(completedSection).getByText('Completed today card')).toBeVisible()

    // Navigate via Mini Calendar day click to /date/:dateKey
    const calendarGrid = screen.getByRole('grid')
    const todayButton = within(calendarGrid)
      .getAllByRole('button')
      .find((button) => button.getAttribute('tabindex') === '0')
    expect(todayButton).toBeDefined()
    await user.click(todayButton!)

    await waitFor(() => {
      expect(window.location.hash).toBe(`#/date/${todayKey}`)
    })
    expect(
      await screen.findByRole('heading', { name: /Due \(1\)/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: /Updated \(1\)/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: /Completed \(1\)/ }),
    ).toBeVisible()

    // Keyboard arrow navigation inside Mini Calendar
    todayButton?.focus()
    await user.keyboard('{ArrowRight}')
    const nextFocusable = document.activeElement
    expect(nextFocusable).toBeInstanceOf(HTMLButtonElement)
    expect(nextFocusable).not.toBe(todayButton)
  })
})
