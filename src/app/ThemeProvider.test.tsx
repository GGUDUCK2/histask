import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import type { RepositoryQuery } from '@/repositories/query'
import type { SettingsRepository } from '@/repositories/settings'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './theme-context'
import { installMatchMedia } from '@/test/match-media'
import type { Theme } from '@/types/settings'

function Controls() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <>
      <output>
        {theme}:{resolvedTheme}
      </output>
      {(['light', 'dark', 'system'] as const).map((value) => (
        <button key={value} onClick={() => setTheme(value)}>
          {value}
        </button>
      ))}
    </>
  )
}
afterEach(() => vi.unstubAllGlobals())
it('follows the OS only in System and switches light/dark explicitly', async () => {
  const media = installMatchMedia(true)
  const user = userEvent.setup()
  render(
    <ThemeProvider>
      <Controls />
    </ThemeProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('system:dark')
  expect(document.documentElement).toHaveClass('dark')
  act(() => media.change(false))
  expect(document.documentElement.dataset.theme).toBe('light')
  await user.click(screen.getByText('dark', { selector: 'button' }))
  act(() => media.change(true))
  act(() => media.change(false))
  expect(screen.getByRole('status')).toHaveTextContent('dark:dark')
  await user.click(screen.getByText('light', { selector: 'button' }))
  expect(document.documentElement).not.toHaveClass('dark')
  await user.click(screen.getByText('system', { selector: 'button' }))
  act(() => media.change(true))
  expect(screen.getByRole('status')).toHaveTextContent('system:dark')
})
it('cleans OS listeners and root theme on StrictMode unmount without persisting', () => {
  const media = installMatchMedia()
  const write = vi.spyOn(Storage.prototype, 'setItem')
  const { unmount } = render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark">
        <Controls />
      </ThemeProvider>
    </StrictMode>,
  )
  expect(media.listenerCount()).toBe(1)
  unmount()
  expect(media.listenerCount()).toBe(0)
  expect(document.documentElement).not.toHaveClass('dark')
  expect(document.documentElement.dataset.theme).toBeUndefined()
  expect(write).not.toHaveBeenCalled()
})

function unusedThemeQuery(): RepositoryQuery<Theme> {
  return { subscribe: () => () => undefined }
}

it('loads and saves a repository-backed theme preference', async () => {
  installMatchMedia(false)
  let saved: Theme = 'dark'
  const repository: SettingsRepository = {
    getTheme: vi.fn(async () => saved),
    setTheme: vi.fn(async (theme) => {
      saved = theme
    }),
    observeTheme: unusedThemeQuery,
  }
  const user = userEvent.setup()
  render(
    <ThemeProvider repository={repository}>
      <Controls />
    </ThemeProvider>,
  )

  expect(await screen.findByRole('status')).toHaveTextContent('dark:dark')
  await user.click(screen.getByText('light', { selector: 'button' }))
  expect(repository.setTheme).toHaveBeenCalledWith('light')
  expect(screen.getByRole('status')).toHaveTextContent('light:light')
})

it('keeps the current theme and reports a failed preference write', async () => {
  installMatchMedia(false)
  const repository: SettingsRepository = {
    getTheme: vi.fn(async (): Promise<Theme> => 'system'),
    setTheme: vi.fn(async () => {
      throw new Error('write failed')
    }),
    observeTheme: unusedThemeQuery,
  }
  function FailureControls() {
    const { preferenceError, theme, setTheme } = useTheme()
    return (
      <>
        <output>{theme}</output>
        <button onClick={() => void setTheme('dark')}>save dark</button>
        {preferenceError && <p role="alert">{preferenceError}</p>}
      </>
    )
  }
  const user = userEvent.setup()
  render(
    <ThemeProvider repository={repository}>
      <FailureControls />
    </ThemeProvider>,
  )

  await waitFor(() => expect(repository.getTheme).toHaveBeenCalled())
  await user.click(screen.getByRole('button', { name: 'save dark' }))
  expect(screen.getByRole('status')).toHaveTextContent('system')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not save the theme preference.',
  )
})
