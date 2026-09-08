import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { ThemeContext, type Theme } from './theme-context'
import type { SettingsRepository } from '@/repositories/settings'

const query = '(prefers-color-scheme: dark)'
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
function getSnapshot() {
  return window.matchMedia(query).matches
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  repository,
}: {
  children: ReactNode
  defaultTheme?: Theme
  repository?: SettingsRepository
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [preferenceLoading, setPreferenceLoading] = useState(
    repository !== undefined,
  )
  const [preferenceError, setPreferenceError] = useState<string | null>(null)
  const systemDark = useSyncExternalStore(subscribe, getSnapshot, () => false)
  const resolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useLayoutEffect(() => {
    const root = document.documentElement
    const previousTheme = root.dataset.theme
    const previousDark = root.classList.contains('dark')
    root.dataset.theme = resolvedTheme
    root.classList.toggle('dark', resolvedTheme === 'dark')
    return () => {
      if (previousTheme === undefined) delete root.dataset.theme
      else root.dataset.theme = previousTheme
      root.classList.toggle('dark', previousDark)
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (!repository) return
    let active = true
    void repository
      .getTheme()
      .then((storedTheme) => {
        if (!active) return
        setTheme(storedTheme)
        setPreferenceError(null)
      })
      .catch(() => {
        if (!active) return
        setPreferenceError('Could not read the saved theme preference.')
      })
      .finally(() => {
        if (active) setPreferenceLoading(false)
      })
    return () => {
      active = false
    }
  }, [repository])

  const updateTheme = useCallback(
    async (nextTheme: Theme) => {
      setPreferenceLoading(true)
      try {
        if (repository) await repository.setTheme(nextTheme)
        setTheme(nextTheme)
        setPreferenceError(null)
        return true
      } catch {
        setPreferenceError('Could not save the theme preference.')
        return false
      } finally {
        setPreferenceLoading(false)
      }
    },
    [repository],
  )

  const resetLocalTheme = useCallback(() => {
    setTheme('system')
    setPreferenceError(null)
    setPreferenceLoading(false)
  }, [])

  return (
    <ThemeContext
      value={{
        theme,
        resolvedTheme,
        preferenceLoading,
        preferenceError,
        setTheme: updateTheme,
        resetLocalTheme,
      }}
    >
      {children}
    </ThemeContext>
  )
}
