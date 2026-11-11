import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { ValidationError } from '@/services/validation'
import {
  CARD_STATUSES,
  CARD_STATUS_LABELS,
  type CardStatus,
} from '@/types/domain'
import { isReactImeComposing } from '@/utils/keyboard'

function toFriendlyError(error: unknown): string {
  if (error instanceof ValidationError) return error.message
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Could not create task locally. Please try again.'
}

export function InlineQuickAdd({
  status,
  onCancel,
  onCreated,
}: {
  status: CardStatus
  onCancel: () => void
  onCreated?: () => void
}) {
  const { services } = useWorkspace()
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastCompositionEndAtRef = useRef(0)
  const submitLockRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit() {
    if (submitLockRef.current) return
    if (!title.trim()) {
      setError('Task title is required.')
      inputRef.current?.focus()
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      await services.cards.create({
        title,
        status,
      })
      setTitle('')
      onCreated?.()
    } catch (caughtError) {
      setError(toFriendlyError(caughtError))
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleSubmit()
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (isReactImeComposing(event, lastCompositionEndAtRef.current)) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
    }
  }

  return (
    <form
      onSubmit={onFormSubmit}
      className="grid gap-2 rounded-card border border-[var(--border-strong)] bg-surface p-2.5"
    >
      <Label htmlFor={`quick-add-${status}`} className="sr-only">
        New {CARD_STATUS_LABELS[status]} task title
      </Label>
      <Input
        ref={inputRef}
        id={`quick-add-${status}`}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value)
          if (error) setError(null)
        }}
        onCompositionEnd={(event) => {
          lastCompositionEndAtRef.current = event.timeStamp
        }}
        onKeyDown={onKeyDown}
        placeholder="Task title..."
        disabled={submitting}
        aria-invalid={error !== null}
        aria-describedby={error ? `quick-add-error-${status}` : undefined}
      />
      {error && (
        <p
          id={`quick-add-error-${status}`}
          role="alert"
          className="text-metadata text-[var(--danger)]"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          <X className="size-3.5" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          <Plus className="size-3.5" />
          {submitting ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

export function QuickCreateDialog() {
  const { quickCreateStatus, closeQuickCreate } = useWorkspace()

  if (quickCreateStatus === null) return null

  return (
    <QuickCreateDialogInner
      key={quickCreateStatus}
      initialStatus={quickCreateStatus}
      onClose={closeQuickCreate}
    />
  )
}

function QuickCreateDialogInner({
  initialStatus,
  onClose,
}: {
  initialStatus: CardStatus
  onClose: () => void
}) {
  const { services } = useWorkspace()
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<CardStatus>(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastCompositionEndAtRef = useRef(0)
  const submitLockRef = useRef(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLockRef.current) return
    if (!title.trim()) {
      setError('Task title is required.')
      inputRef.current?.focus()
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      await services.cards.create({
        title,
        status,
      })
      setTitle('')
      onClose()
    } catch (caughtError) {
      setError(toFriendlyError(caughtError))
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (
      event.key === 'Enter' &&
      isReactImeComposing(event, lastCompositionEndAtRef.current)
    ) {
      event.preventDefault()
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Create a task with a title and initial status. You can add notes and
            WorkLogs anytime.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="global-new-task-title">Title</Label>
            <Input
              ref={inputRef}
              id="global-new-task-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (error) setError(null)
              }}
              onCompositionEnd={(event) => {
                lastCompositionEndAtRef.current = event.timeStamp
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="What needs progress?"
              disabled={submitting}
              aria-invalid={error !== null}
              aria-describedby={error ? 'global-new-task-error' : undefined}
            />
            {error && (
              <p
                id="global-new-task-error"
                role="alert"
                className="text-metadata text-[var(--danger)]"
              >
                {error}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="global-new-task-status">Column</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as CardStatus)}
              disabled={submitting}
            >
              <SelectTrigger id="global-new-task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {CARD_STATUS_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
