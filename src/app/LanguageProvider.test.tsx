import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import type { RepositoryQuery } from '@/repositories/query'
import type { LanguagePreferenceRepository } from '@/repositories/settings'
import type { Language } from '@/types/settings'
import { LanguageProvider } from './LanguageProvider'
import { useI18n } from './language-context'

function Controls() {
  const { language, resolvedLanguage, setLanguage } = useI18n()
  return (
    <>
      <output>
        {language}:{resolvedLanguage}
      </output>
      {(['system', 'en', 'ko'] as const).map((value) => (
        <button key={value} onClick={() => void setLanguage(value)}>
          {value}
        </button>
      ))}
    </>
  )
}

function unusedLanguageQuery(): RepositoryQuery<Language> {
  return { subscribe: () => () => undefined }
}

afterEach(() => vi.restoreAllMocks())

it('follows browser locale in System mode and switches explicit English/Korean', async () => {
  const langSpy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
  const langsSpy = vi
    .spyOn(navigator, 'languages', 'get')
    .mockReturnValue(['en-US'])
  const user = userEvent.setup()

  render(
    <LanguageProvider>
      <Controls />
    </LanguageProvider>,
  )

  expect(screen.getByRole('status')).toHaveTextContent('system:en')
  expect(document.documentElement.lang).toBe('en')

  langSpy.mockReturnValue('ko-KR')
  langsSpy.mockReturnValue(['ko-KR'])
  act(() => {
    window.dispatchEvent(new Event('languagechange'))
  })
  expect(screen.getByRole('status')).toHaveTextContent('system:ko')
  expect(document.documentElement.lang).toBe('ko')

  await user.click(screen.getByText('en', { selector: 'button' }))
  expect(screen.getByRole('status')).toHaveTextContent('en:en')
  expect(document.documentElement.lang).toBe('en')

  await user.click(screen.getByText('ko', { selector: 'button' }))
  expect(screen.getByRole('status')).toHaveTextContent('ko:ko')
  expect(document.documentElement.lang).toBe('ko')
})

it('restores document.lang on StrictMode unmount without saving', () => {
  document.documentElement.lang = 'en'
  const addSpy = vi.spyOn(window, 'addEventListener')
  const removeSpy = vi.spyOn(window, 'removeEventListener')
  const { unmount } = render(
    <StrictMode>
      <LanguageProvider defaultLanguage="ko">
        <Controls />
      </LanguageProvider>
    </StrictMode>,
  )

  expect(document.documentElement.lang).toBe('ko')
  expect(addSpy).toHaveBeenCalledWith('languagechange', expect.any(Function))
  unmount()
  expect(removeSpy).toHaveBeenCalledWith('languagechange', expect.any(Function))
  expect(document.documentElement.lang).toBe('en')
})

it('loads and saves repository-backed language preference', async () => {
  let saved: Language = 'ko'
  const repository: LanguagePreferenceRepository = {
    getLanguage: vi.fn(async () => saved),
    setLanguage: vi.fn(async (next) => {
      saved = next
    }),
    observeLanguage: unusedLanguageQuery,
  }
  const user = userEvent.setup()

  render(
    <LanguageProvider repository={repository}>
      <Controls />
    </LanguageProvider>,
  )

  expect(await screen.findByRole('status')).toHaveTextContent('ko:ko')
  await user.click(screen.getByText('en', { selector: 'button' }))
  expect(repository.setLanguage).toHaveBeenCalledWith('en')
  expect(screen.getByRole('status')).toHaveTextContent('en:en')
})

it('keeps the current language and reports a failed preference write', async () => {
  const repository: LanguagePreferenceRepository = {
    getLanguage: vi.fn(async (): Promise<Language> => 'en'),
    setLanguage: vi.fn(async () => {
      throw new Error('write failed')
    }),
    observeLanguage: unusedLanguageQuery,
  }

  function FailureControls() {
    const { language, preferenceError, setLanguage } = useI18n()
    return (
      <>
        <output>{language}</output>
        <button onClick={() => void setLanguage('ko')}>save ko</button>
        {preferenceError && <p role="alert">{preferenceError}</p>}
      </>
    )
  }

  const user = userEvent.setup()
  render(
    <LanguageProvider repository={repository}>
      <FailureControls />
    </LanguageProvider>,
  )

  expect(await screen.findByRole('status')).toHaveTextContent('en')
  await user.click(screen.getByRole('button', { name: 'save ko' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('save'))
  expect(screen.getByRole('status')).toHaveTextContent('en')
})
