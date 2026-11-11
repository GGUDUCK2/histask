import { useRef, useState } from 'react'
import { Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { WorkLogComposer } from '@/features/worklogs/WorkLogComposer'
import { WorkLogTimeline } from '@/features/worklogs/WorkLogTimeline'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { CARD_STATUS_LABELS } from '@/types/domain'
import { CardFields } from './CardFields'

export function CardDetailDrawer() {
  const { snapshot, selectedCardProjection, closeCard, services } =
    useWorkspace()

  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const actionLockRef = useRef(false)

  const card = selectedCardProjection?.card
  const workLogs = card ? (snapshot.workLogsByCard.get(card.id) ?? []) : []

  async function handleArchive() {
    if (!card || actionLockRef.current) return
    actionLockRef.current = true
    setActionBusy(true)
    setActionError(null)
    try {
      await services.cards.archive(card.id)
      setArchiveConfirmOpen(false)
      closeCard()
    } catch {
      setActionError('Could not archive this task locally.')
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

  async function handlePermanentDelete() {
    if (!card || actionLockRef.current) return
    actionLockRef.current = true
    setActionBusy(true)
    setActionError(null)
    try {
      await services.cards.deletePermanently(card.id)
      setDeleteConfirmOpen(false)
      closeCard()
    } catch {
      setActionError('Could not delete this task locally.')
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

  return (
    <>
      <Sheet
        open={selectedCardProjection !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveConfirmOpen(false)
            setDeleteConfirmOpen(false)
            closeCard()
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-5 p-4 sm:w-[490px] sm:p-5"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          {selectedCardProjection && card && (
            <>
              <div className="grid gap-2 border-b pb-3 pr-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-tag border bg-surface-subtle px-2 py-0.5 text-tag font-medium text-secondary-foreground">
                    {CARD_STATUS_LABELS[card.status]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActionError(null)
                        setArchiveConfirmOpen(true)
                      }}
                    >
                      <Archive className="size-3.5" />
                      Archive
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                      onClick={() => {
                        setActionError(null)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
                <SheetTitle className="text-page-title font-semibold break-words">
                  {card.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Edit task details and record progress WorkLogs for {card.title}.
                </SheetDescription>
              </div>

              <CardFields projection={selectedCardProjection} />

              <div className="border-t pt-4">
                <section aria-labelledby="card-history-heading" className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <h3
                      id="card-history-heading"
                      className="text-ui font-semibold uppercase tracking-wide text-secondary-foreground"
                    >
                      History ({workLogs.length})
                    </h3>
                  </div>

                  <WorkLogComposer cardId={card.id} />
                  <WorkLogTimeline workLogs={workLogs} />
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={archiveConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !actionBusy) setArchiveConfirmOpen(false)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive task?</DialogTitle>
            <DialogDescription>
              Archiving removes <strong>{card?.title}</strong> from active boards
              and metrics while keeping the task and all its WorkLogs preserved
              inside JSON backups.
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p role="alert" className="text-ui text-[var(--danger)]">
              {actionError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveConfirmOpen(false)}
              disabled={actionBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleArchive()}
              disabled={actionBusy}
            >
              {actionBusy ? 'Archiving...' : 'Archive task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !actionBusy) setDeleteConfirmOpen(false)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete task permanently?</DialogTitle>
            <DialogDescription>
              This permanently removes <strong>{card?.title}</strong> along with
              all {workLogs.length} WorkLog{workLogs.length === 1 ? '' : 's'}{' '}
              and tag links from local storage. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p role="alert" className="text-ui text-[var(--danger)]">
              {actionError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={actionBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handlePermanentDelete()}
              disabled={actionBusy}
            >
              {actionBusy ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
