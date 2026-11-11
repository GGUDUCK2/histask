import { useSyncExternalStore } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  applyPwaUpdate,
  dismissPwaUpdate,
  getPwaSnapshot,
  subscribePwaState,
} from '@/app/pwa'

export function PwaUpdateBanner() {
  const { needRefresh } = useSyncExternalStore(
    subscribePwaState,
    getPwaSnapshot,
    getPwaSnapshot,
  )

  if (!needRefresh) return null

  return (
    <aside
      aria-label="Application update available"
      className="fixed bottom-4 right-4 z-40 flex max-w-sm items-center gap-3 rounded-card border border-[var(--border-strong)] bg-surface p-3 text-ui shadow-overlay ui-fade"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">Update available</p>
        <p className="text-metadata text-muted-foreground">
          Reload when ready to use the latest app shell. Local data stays
          preserved.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          onClick={() => void applyPwaUpdate()}
        >
          <RefreshCw className="size-3.5" />
          Reload
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Dismiss update notification"
          className="size-7 text-muted-foreground"
          onClick={dismissPwaUpdate}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </aside>
  )
}
