import { Button } from '@/components/ui/button'
import type { RefObject } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PreparedBackup } from '@/services/backup'

export function ImportBackupDialog({
  fileName,
  onConfirm,
  onOpenChange,
  open,
  pending,
  prepared,
  returnFocusRef,
}: {
  fileName: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  pending: boolean
  prepared: PreparedBackup
  returnFocusRef: RefObject<HTMLButtonElement | null>
}) {
  const rows = [
    ['Cards', prepared.counts.cards],
    ['WorkLogs', prepared.counts.workLogs],
    ['Categories', prepared.counts.categories],
    ['Tags', prepared.counts.tags],
    ['Tag links', prepared.counts.cardTags],
  ] as const

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Replace existing data?</DialogTitle>
          <DialogDescription>
            {fileName} passed full validation. Importing it replaces every
            current Card, WorkLog, Category, Tag, and tag link. Theme settings
            stay unchanged.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-card border bg-surface-subtle p-3 text-ui">
          {rows.map(([label, count]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium tabular-nums">{count}</dd>
            </div>
          ))}
        </dl>
        <p className="text-metadata text-muted-foreground">
          This operation cannot be merged or undone. Export a current backup
          first if you may need it.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={pending} onClick={onConfirm}>
            {pending ? 'Replacing…' : 'Replace data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
