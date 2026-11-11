import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { ValidationError } from '@/services/validation'
import { isReactImeComposing } from '@/utils/keyboard'

export function WorkLogComposer({ cardId }: { cardId: string }) {
  const { services } = useWorkspace()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const lastCompositionEndAtRef = useRef(0)
  const submitLockRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function submitLog() {
    if (submitLockRef.current) return
    if (!content.trim()) {
      setError('Write a progress note before saving.')
      textareaRef.current?.focus()
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      await services.workLogs.create({ cardId, content })
      setContent('')
    } catch (caughtError) {
      if (caughtError instanceof ValidationError) {
        setError(caughtError.message)
      } else {
        setError('Could not save WorkLog locally. Your note was preserved.')
      }
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitLog()
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (isReactImeComposing(event, lastCompositionEndAtRef.current)) return
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      void submitLog()
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`worklog-composer-${cardId}`}>Add WorkLog</Label>
        <span className="text-metadata text-muted-foreground">
          Enter for newline · Ctrl/Cmd+Enter to save
        </span>
      </div>
      <Textarea
        ref={textareaRef}
        id={`worklog-composer-${cardId}`}
        value={content}
        onChange={(event) => {
          setContent(event.target.value)
          if (error) setError(null)
        }}
        onCompositionEnd={(event) => {
          lastCompositionEndAtRef.current = event.timeStamp
        }}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Record what moved forward, blockers, or next concrete step..."
        disabled={submitting}
        aria-invalid={error !== null}
        aria-describedby={error ? `worklog-composer-error-${cardId}` : undefined}
      />
      {error && (
        <p
          id={`worklog-composer-error-${cardId}`}
          role="alert"
          className="text-metadata text-[var(--danger)]"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          <Send className="size-3.5" />
          {submitting ? 'Saving...' : 'Save WorkLog'}
        </Button>
      </div>
    </form>
  )
}
