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
import { useI18n } from '@/app/language-context'
import { CardFields } from './CardFields'

export function CardDetailDrawer() {
  const { messages } = useI18n()
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
      setActionError(messages.cardDetail.archiveError)
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
      setActionError(messages.cardDetail.deleteError)
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
                    {messages.statuses[card.status]}
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
                      {messages.cardDetail.archive}
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
                      {messages.cardDetail.delete}
                    </Button>
                  </div>
                </div>
                <SheetTitle className="text-page-title font-semibold break-words">
                  {card.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {messages.cardDetail.descriptionSrOnly(card.title)}
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
                      {messages.cardDetail.historyHeading(workLogs.length)}
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
            <DialogTitle>{messages.cardDetail.archiveDialogTitle}</DialogTitle>
            <DialogDescription>
              {messages.cardDetail.archiveDialogDescription(card?.title ?? '')}
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
              {messages.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleArchive()}
              disabled={actionBusy}
            >
              {actionBusy
                ? messages.cardDetail.archiving
                : messages.cardDetail.archiveConfirm}
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
            <DialogTitle>{messages.cardDetail.deleteDialogTitle}</DialogTitle>
            <DialogDescription>
              {messages.cardDetail.deleteDialogDescription(
                card?.title ?? '',
                workLogs.length,
              )}
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
              {messages.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handlePermanentDelete()}
              disabled={actionBusy}
            >
              {actionBusy
                ? messages.common.deleting
                : messages.cardDetail.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
