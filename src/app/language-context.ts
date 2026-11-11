import { createContext, useContext } from 'react'
import {
  getIntlLocale,
  MESSAGES,
  resolveSystemLanguage,
  type Messages,
  type ResolvedLanguage,
} from '@/i18n/messages'
import type { Language } from '@/types/settings'

export type LanguageErrorCode = 'read' | 'save' | null

export interface LanguageContextValue {
  language: Language
  resolvedLanguage: ResolvedLanguage
  intlLocale: string
  messages: Messages
  preferenceLoading: boolean
  preferenceError: LanguageErrorCode
  setLanguage: (language: Language) => Promise<boolean>
  resetLocalLanguage: () => void
}

const fallbackResolved = resolveSystemLanguage()
const DEFAULT_LANGUAGE_CONTEXT: LanguageContextValue = {
  language: 'system',
  resolvedLanguage: fallbackResolved,
  intlLocale: getIntlLocale(fallbackResolved),
  messages: MESSAGES[fallbackResolved],
  preferenceLoading: false,
  preferenceError: null,
  setLanguage: async () => true,
  resetLocalLanguage: () => undefined,
}

export const LanguageContext = createContext<LanguageContextValue>(
  DEFAULT_LANGUAGE_CONTEXT,
)

export function useI18n(): LanguageContextValue {
  return useContext(LanguageContext)
}
