import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  getIntlLocale,
  MESSAGES,
  resolveSystemLanguage,
  type ResolvedLanguage,
} from '@/i18n/messages'
import type { LanguagePreferenceRepository } from '@/repositories/settings'
import type { Language } from '@/types/settings'
import {
  LanguageContext,
  type LanguageErrorCode,
} from './language-context'

function subscribeSystemLanguage(onChange: () => void) {
  window.addEventListener('languagechange', onChange)
  return () => window.removeEventListener('languagechange', onChange)
}

function getSystemLanguageSnapshot(): ResolvedLanguage {
  return resolveSystemLanguage()
}

export function LanguageProvider({
  children,
  defaultLanguage = 'system',
  repository,
}: {
  children: ReactNode
  defaultLanguage?: Language
  repository?: LanguagePreferenceRepository
}) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [preferenceLoading, setPreferenceLoading] = useState(
    repository !== undefined,
  )
  const [preferenceError, setPreferenceError] =
    useState<LanguageErrorCode>(null)
  const systemLanguage = useSyncExternalStore(
    subscribeSystemLanguage,
    getSystemLanguageSnapshot,
    () => 'en' as const,
  )

  const resolvedLanguage: ResolvedLanguage =
    language === 'system' ? systemLanguage : language

  useLayoutEffect(() => {
    const root = document.documentElement
    const previousLang = root.lang
    root.lang = resolvedLanguage
    return () => {
      root.lang = previousLang
    }
  }, [resolvedLanguage])

  useEffect(() => {
    if (!repository) return
    let active = true
    void repository
      .getLanguage()
      .then((storedLanguage) => {
        if (!active) return
        setLanguage(storedLanguage)
        setPreferenceError(null)
      })
      .catch(() => {
        if (!active) return
        setPreferenceError('read')
      })
      .finally(() => {
        if (active) setPreferenceLoading(false)
      })
    return () => {
      active = false
    }
  }, [repository])

  const updateLanguage = useCallback(
    async (nextLanguage: Language) => {
      setPreferenceLoading(true)
      try {
        if (repository) await repository.setLanguage(nextLanguage)
        setLanguage(nextLanguage)
        setPreferenceError(null)
        return true
      } catch {
        setPreferenceError('save')
        return false
      } finally {
        setPreferenceLoading(false)
      }
    },
    [repository],
  )

  const resetLocalLanguage = useCallback(() => {
    setLanguage('system')
    setPreferenceError(null)
    setPreferenceLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      language,
      resolvedLanguage,
      intlLocale: getIntlLocale(resolvedLanguage),
      messages: MESSAGES[resolvedLanguage],
      preferenceLoading,
      preferenceError,
      setLanguage: updateLanguage,
      resetLocalLanguage,
    }),
    [
      language,
      preferenceError,
      preferenceLoading,
      resetLocalLanguage,
      resolvedLanguage,
      updateLanguage,
    ],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
