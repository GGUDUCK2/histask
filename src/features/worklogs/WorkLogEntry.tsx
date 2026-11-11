import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { WorkLog } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatExactTime, formatRelativeTime } from '@/utils/dates'
import { isReactImeComposing } from '@/utils/keyboard'

export function WorkLogEntry({
  workLog,
  isLatest,
}: {
  workLog: WorkLog
  isLatest: boolean
}) {
  const { services } = useWorkspace()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(workLog.content)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const lastCompositionEndAtRef = useRef(0)
  const saveLockRef = useRef(false)
  const deleteLockRef = useRef(false)

  const wasEdited = workLog.updatedAt > workLog.createdAt
  const createdExact = formatExactTime(workLog.createdAt)
  const updatedExact = formatExactTime(workLog.updatedAt)

  function startEditing() {
    setDraft(workLog.content)
    setEditError(null)
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(workLog.content)
    setEditError(null)
    setEditing(false)
  }

  async function saveEdit() {
    if (saveLockRef.current) return
    if (!draft.trim()) {
      setEditError('WorkLog content cannot be empty.')
      return
    }

    saveLockRef.current = true
    setSaving(true)
    setEditError(null)
    try {
      await services.workLogs.update(workLog.id, draft)
      setEditing(false)
    } catch {
      setEditError('Could not update WorkLog locally. Your draft was kept.')
    } finally {
      saveLockRef.current = false
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (deleteLockRef.current) return
    deleteLockRef.current = true
    setDeleting(true)
    setDeleteError(null)
    try {
      await services.workLogs.delete(workLog.id)
      setDeleteConfirmOpen(false)
    } catch {
      setDeleteError('Could not delete this WorkLog locally.')
    } finally {
      deleteLockRef.current = false
      setDeleting(false)
    }
  }

  function handleEditFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void saveEdit()
  }

  function handleEditKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (isReactImeComposing(event, lastCompositionEndAtRef.current)) return
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      void saveEdit()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancelEditing()
    }
  }

  return (
    <li className="group/timeline relative pl-5 pb-4 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[5px] top-2 w-px bg-border group-last/timeline:hidden"
      />
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-surface',
          isLatest ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]',
        )}
      />

      <div className="grid gap-1.5 rounded-card border bg-surface-subtle/50 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-metadata text-muted-foreground">
            <time dateTime={workLog.createdAt} title={createdExact}>
              {formatRelativeTime(workLog.createdAt)} · {createdExact}
            </time>
            {isLatest && (
              <span className="rounded-tag border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-1.5 py-0 text-tag font-medium text-[var(--accent)]">
                Latest
              </span>
            )}
            {wasEdited && (
              <span title={`Edited ${updatedExact}`} className="text-tag">
                (edited)
              </span>
            )}
          </div>

          {!editing && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Edit WorkLog"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={startEditing}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete WorkLog"
                className="size-6 text-muted-foreground hover:text-[var(--danger)]"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteConfirmOpen(true)
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleEditFormSubmit} className="grid gap-2">
            <Textarea
              aria-label="Edit WorkLog content"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                if (editError) setEditError(null)
              }}
              onCompositionEnd={(event) => {
                lastCompositionEndAtRef.current = event.timeStamp
              }}
              onKeyDown={handleEditKeyDown}
              rows={3}
              disabled={saving}
              aria-invalid={editError !== null}
            />
            {editError && (
              <p role="alert" className="text-metadata text-[var(--danger)]">
                {editError}
              </p>
            )}
            <div className="flex justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap break-words text-ui text-foreground">
            {workLog.content}
          </p>
        )}
      </div>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteConfirmOpen(false)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete WorkLog?</DialogTitle>
            <DialogDescription>
              This WorkLog entry will be permanently removed from this task&apos;s
              progress history. The task card will update to show the previous
              WorkLog (if any).
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-ui text-[var(--danger)]">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete WorkLog'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}
