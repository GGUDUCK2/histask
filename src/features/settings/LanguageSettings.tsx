import { Languages } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LANGUAGES, type Language } from '@/types/settings'

export function LanguageSettings() {
  const {
    language,
    messages,
    preferenceError,
    preferenceLoading,
    setLanguage,
  } = useI18n()

  return (
    <div className="settings-row items-start">
      <Languages className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{messages.settings.languageTitle}</div>
        <p className="mt-0.5 text-metadata text-muted-foreground">
          {messages.settings.languageDescription}
        </p>
        {preferenceError && (
          <p className="mt-1 text-metadata text-destructive" role="alert">
            {preferenceError === 'read'
              ? messages.settings.languageReadError
              : messages.settings.languageSaveError}
          </p>
        )}
      </div>
      <Select
        value={language}
        disabled={preferenceLoading}
        onValueChange={(value) => void setLanguage(value as Language)}
      >
        <SelectTrigger
          aria-label={messages.settings.languageTitle}
          className="h-control-sm w-[140px] shrink-0 text-ui"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((value) => (
            <SelectItem key={value} value={value}>
              {messages.settings.languageOptions[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
