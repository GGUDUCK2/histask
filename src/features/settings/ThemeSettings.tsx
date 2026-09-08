import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/theme-context'
import { Button } from '@/components/ui/button'
import { THEMES, type Theme } from '@/types/settings'
import { cn } from '@/utils/cn'

const themeDetails = {
  system: { label: 'System', icon: Monitor },
  light: { label: 'Light', icon: Sun },
  dark: { label: 'Dark', icon: Moon },
} satisfies Record<Theme, { label: string; icon: typeof Monitor }>

export function ThemeSettings() {
  const { theme, preferenceError, preferenceLoading, setTheme } = useTheme()

  return (
    <div className="settings-row items-start">
      <div className="min-w-0 flex-1">
        <div className="font-medium">Theme</div>
        <p className="mt-0.5 text-metadata text-muted-foreground">
          System follows your operating system appearance.
        </p>
        {preferenceError && (
          <p className="mt-1 text-metadata text-destructive" role="alert">
            {preferenceError}
          </p>
        )}
      </div>
      <div className="flex rounded-control border bg-surface p-0.5">
        {THEMES.map((value) => {
          const { icon: Icon, label } = themeDetails[value]
          return (
            <Button
              key={value}
              variant="ghost"
              size="sm"
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
