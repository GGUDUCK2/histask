import { useSyncExternalStore } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import {
  applyPwaUpdate,
  dismissPwaUpdate,
  getPwaSnapshot,
  subscribePwaState,
} from '@/app/pwa'

export function PwaUpdateBanner() {
  const { messages } = useI18n()
  const { needRefresh } = useSyncExternalStore(
    subscribePwaState,
    getPwaSnapshot,
    getPwaSnapshot,
  )

  if (!needRefresh) return null

  return (
    <aside
      aria-label={messages.appShell.pwaUpdateRegionLabel}
      className="fixed bottom-4 right-4 z-40 flex max-w-sm items-center gap-3 rounded-card border border-[var(--border-strong)] bg-surface p-3 text-ui shadow-overlay ui-fade"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          {messages.appShell.pwaUpdateTitle}
        </p>
        <p className="text-metadata text-muted-foreground">
          {messages.appShell.pwaUpdateDescription}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          onClick={() => void applyPwaUpdate()}
        >
          <RefreshCw className="size-3.5" />
          {messages.common.reload}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={messages.appShell.pwaUpdateDismiss}
          className="size-7 text-muted-foreground"
          onClick={dismissPwaUpdate}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </aside>
  )
}
