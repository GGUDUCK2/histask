import type { RefObject } from 'react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
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
  const { messages } = useI18n()
  const rows = [
    [messages.settings.importDialogRows.cards, prepared.counts.cards],
    [messages.settings.importDialogRows.workLogs, prepared.counts.workLogs],
    [messages.settings.importDialogRows.categories, prepared.counts.categories],
    [messages.settings.importDialogRows.tags, prepared.counts.tags],
    [messages.settings.importDialogRows.cardTags, prepared.counts.cardTags],
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
          <DialogTitle>{messages.settings.importDialogTitle}</DialogTitle>
          <DialogDescription>
            {messages.settings.importDialogDescription(fileName)}
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
          {messages.settings.importDialogWarning}
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {messages.common.cancel}
          </Button>
          <Button disabled={pending} onClick={onConfirm}>
            {pending
              ? messages.settings.importDialogConfirming
              : messages.settings.importDialogConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
