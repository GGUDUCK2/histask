export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value)
}

export const LANGUAGES = ['system', 'en', 'ko'] as const
export type Language = (typeof LANGUAGES)[number]

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value)
}
