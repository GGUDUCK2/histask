import { Monitor, Moon, Sun } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { useTheme } from '@/app/theme-context'
import { Button } from '@/components/ui/button'
import { THEMES, type Theme } from '@/types/settings'
import { cn } from '@/utils/cn'

const themeIcons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} satisfies Record<Theme, typeof Monitor>

export function ThemeSettings() {
  const { theme, preferenceError, preferenceLoading, setTheme } = useTheme()
  const { messages } = useI18n()

  const resolvedError =
    preferenceError === null
      ? null
      : preferenceError.toLowerCase().includes('read')
        ? messages.settings.themeReadError
        : messages.settings.themeSaveError

  return (
    <div className="settings-row items-start">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{messages.settings.themeTitle}</div>
        <p className="mt-0.5 text-metadata text-muted-foreground">
          {messages.settings.themeDescription}
        </p>
        {resolvedError && (
          <p className="mt-1 text-metadata text-destructive" role="alert">
            {resolvedError}
          </p>
        )}
      </div>
      <div className="flex rounded-control border bg-surface p-0.5">
        {THEMES.map((value) => {
          const Icon = themeIcons[value]
          const label = messages.settings.themeOptions[value]
          return (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              aria-label={label}
              aria-pressed={theme === value}
              disabled={preferenceLoading}
              className={cn(
                'h-7 px-2',
                theme === value && 'bg-accent text-accent-foreground',
              )}
              onClick={() => void setTheme(value)}
            >
              <Icon />
              <span className="hidden lg:inline">{label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
