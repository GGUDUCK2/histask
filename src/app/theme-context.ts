import { createContext, useContext } from 'react'
import type { Theme } from '@/types/settings'

export type { Theme } from '@/types/settings'
export type ResolvedTheme = Exclude<Theme, 'system'>
export const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: ResolvedTheme
  preferenceLoading: boolean
  preferenceError: string | null
  setTheme: (theme: Theme) => Promise<boolean>
  resetLocalTheme: () => void
} | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme requires a ThemeProvider')
  return context
}
