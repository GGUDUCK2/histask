import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Check, Plus, Save, X } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { BoardCardProjection } from '@/services/board-query'
import { ValidationError } from '@/services/validation'
import {
  CARD_STATUSES,
  PRIORITIES,
  type CardStatus,
  type Priority,
} from '@/types/domain'
import { getClassificationMeta } from '@/utils/classification-styles'
import { cn } from '@/utils/cn'
import { formatExactTime } from '@/utils/dates'

const NO_CATEGORY = '__none__'

interface DraftFields {
  title: string
  description: string
  status: CardStatus
  categoryId: string | null
  priority: Priority
  dueDate: string
  tagIds: string[]
}

function toDraft(projection: BoardCardProjection): DraftFields {
  const { card, tags } = projection
  return {
    title: card.title,
    description: card.description ?? '',
    status: card.status,
    categoryId: card.categoryId ?? null,
    priority: card.priority,
    dueDate: card.dueDate ?? '',
    tagIds: tags.map(({ id }) => id),
  }
}

function sameTagSelection(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((id) => rightSet.has(id))
}

export function CardFields({ projection }: { projection: BoardCardProjection }) {
  const { intlLocale, messages } = useI18n()
  const { services, snapshot, openClassificationDialog } = useWorkspace()
  const { card, tags } = projection
  const [draft, setDraft] = useState<DraftFields>(() => toDraft(projection))
  const [error, setError] = useState<string | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveLockRef = useRef(false)
  const previousCardIdRef = useRef(card.id)

  const dirty = useMemo(() => {
    const serverTagIds = tags.map(({ id }) => id)
    return (
      draft.title !== card.title ||
      draft.description !== (card.description ?? '') ||
      draft.status !== card.status ||
      draft.categoryId !== (card.categoryId ?? null) ||
      draft.priority !== card.priority ||
      draft.dueDate !== (card.dueDate ?? '') ||
      !sameTagSelection(draft.tagIds, serverTagIds)
    )
  }, [card, draft, tags])

  useEffect(() => {
    if (previousCardIdRef.current !== card.id) {
      previousCardIdRef.current = card.id
      setDraft(toDraft(projection))
      setError(null)
      setSavedNotice(false)
      return
    }

    // Keep tag list clean if a tag or category was deleted externally.
    const validCategoryIds = new Set(snapshot.categories.map(({ id }) => id))
    const validTagIds = new Set(snapshot.tags.map(({ id }) => id))
    setDraft((previous) => {
      const nextCategoryId =
        previous.categoryId && !validCategoryIds.has(previous.categoryId)
          ? null
          : previous.categoryId
      const nextTagIds = previous.tagIds.filter((id) => validTagIds.has(id))
      if (
        nextCategoryId === previous.categoryId &&
        nextTagIds.length === previous.tagIds.length
      ) {
        return previous
      }
      return {
        ...previous,
        categoryId: nextCategoryId,
        tagIds: nextTagIds,
      }
    })
  }, [card.id, projection, snapshot.categories, snapshot.tags])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveLockRef.current) return
    if (!draft.title.trim()) {
      setError(messages.board.taskTitleRequired)
      return
    }

    saveLockRef.current = true
    setSaving(true)
    setError(null)
    setSavedNotice(false)
    try {
      await services.cards.update(card.id, {
        title: draft.title,
        description: draft.description ? draft.description : null,
        status: draft.status,
        categoryId: draft.categoryId,
        priority: draft.priority,
        dueDate: draft.dueDate ? draft.dueDate : null,
        tagIds: draft.tagIds,
      })
      setSavedNotice(true)
    } catch (caughtError) {
      if (caughtError instanceof ValidationError) {
        setError(caughtError.message)
      } else {
        setError(messages.cardDetail.saveErrorFallback)
      }
    } finally {
      saveLockRef.current = false
      setSaving(false)
    }
  }

  function toggleTag(tagId: string) {
    setSavedNotice(false)
    setDraft((previous) => {
      const exists = previous.tagIds.includes(tagId)
      return {
        ...previous,
        tagIds: exists
          ? previous.tagIds.filter((id) => id !== tagId)
          : [...previous.tagIds, tagId],
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor={`card-title-${card.id}`}>
          {messages.cardDetail.titleField}
        </Label>
        <Input
          id={`card-title-${card.id}`}
          value={draft.title}
          onChange={(event) => {
            setDraft((prev) => ({ ...prev, title: event.target.value }))
            setSavedNotice(false)
            if (error) setError(null)
          }}
          disabled={saving}
          aria-invalid={error !== null}
          aria-describedby={error ? `card-fields-error-${card.id}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`card-status-${card.id}`}>
            {messages.cardDetail.statusField}
          </Label>
          <Select
            value={draft.status}
            onValueChange={(value) => {
              setSavedNotice(false)
              setDraft((prev) => ({ ...prev, status: value as CardStatus }))
            }}
            disabled={saving}
          >
            <SelectTrigger id={`card-status-${card.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {messages.statuses[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`card-priority-${card.id}`}>
            {messages.cardDetail.priorityField}
          </Label>
          <Select
            value={draft.priority}
            onValueChange={(value) => {
              setSavedNotice(false)
              setDraft((prev) => ({ ...prev, priority: value as Priority }))
            }}
            disabled={saving}
          >
            <SelectTrigger id={`card-priority-${card.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {messages.priorities[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`card-category-${card.id}`}>
              {messages.cardDetail.categoryField}
            </Label>
            <button
              type="button"
              onClick={(event) =>
                openClassificationDialog(
                  { kind: 'category', mode: 'create' },
                  event.currentTarget,
                )
              }
              className="inline-flex items-center gap-0.5 rounded-control px-1 text-metadata text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <Plus className="size-3" />
              {messages.common.newLabel}
            </button>
          </div>
          <Select
            value={draft.categoryId ?? NO_CATEGORY}
            onValueChange={(value) => {
              setSavedNotice(false)
              setDraft((prev) => ({
                ...prev,
                categoryId: value === NO_CATEGORY ? null : value,
              }))
            }}
            disabled={saving}
          >
            <SelectTrigger id={`card-category-${card.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>
                {messages.cardDetail.noCategory}
              </SelectItem>
              {snapshot.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`card-due-${card.id}`}>
              {messages.cardDetail.dueDateField}
            </Label>
            {draft.dueDate && (
              <button
                type="button"
                onClick={() => {
                  setSavedNotice(false)
                  setDraft((prev) => ({ ...prev, dueDate: '' }))
                }}
                className="inline-flex items-center gap-0.5 rounded-control px-1 text-metadata text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              >
                <X className="size-3" />
                {messages.common.clear}
              </button>
            )}
          </div>
          <Input
            id={`card-due-${card.id}`}
            type="date"
            value={draft.dueDate}
            onChange={(event) => {
              setSavedNotice(false)
              setDraft((prev) => ({ ...prev, dueDate: event.target.value }))
            }}
            disabled={saving}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ui font-medium">
            {messages.cardDetail.tagsField}
          </span>
          <button
            type="button"
            onClick={(event) =>
              openClassificationDialog(
                { kind: 'tag', mode: 'create' },
                event.currentTarget,
              )
            }
            className="inline-flex items-center gap-0.5 rounded-control px-1 text-metadata text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <Plus className="size-3" />
            {messages.sidebar.newTag}
          </button>
        </div>
        {snapshot.tags.length === 0 ? (
          <p className="text-metadata text-muted-foreground">
            {messages.cardDetail.noTagsCreated}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {snapshot.tags.map((tag) => {
              const selected = draft.tagIds.includes(tag.id)
              const meta = getClassificationMeta(tag.color)
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={saving}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-tag border px-2 py-0.5 text-tag font-medium transition-colors',
                    selected
                      ? meta.chipClass
                      : 'border-border bg-surface text-muted-foreground hover:bg-surface-hover',
                  )}
                >
                  {selected && <Check className="size-3" />}
                  <span>{tag.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`card-description-${card.id}`}>
          {messages.cardDetail.descriptionField}
        </Label>
        <Textarea
          id={`card-description-${card.id}`}
          value={draft.description}
          onChange={(event) => {
            setSavedNotice(false)
            setDraft((prev) => ({ ...prev, description: event.target.value }))
          }}
          rows={3}
          placeholder={messages.cardDetail.descriptionPlaceholder}
          disabled={saving}
        />
      </div>

      <dl className="grid grid-cols-1 gap-1 rounded-card border bg-surface-subtle/60 px-3 py-2 text-metadata text-muted-foreground sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2 sm:block">
          <dt className="font-medium text-secondary-foreground">
            {messages.cardDetail.createdField}
          </dt>
          <dd>{formatExactTime(card.createdAt, intlLocale)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 sm:block">
          <dt className="font-medium text-secondary-foreground">
            {messages.cardDetail.updatedField}
          </dt>
          <dd>{formatExactTime(card.updatedAt, intlLocale)}</dd>
        </div>
        {card.completedAt && (
          <div className="flex items-center justify-between gap-2 sm:col-span-2 sm:block">
            <dt className="font-medium text-secondary-foreground">
              {messages.cardDetail.completedField}
            </dt>
            <dd>{formatExactTime(card.completedAt, intlLocale)}</dd>
          </div>
        )}
      </dl>

      {error && (
        <p
          id={`card-fields-error-${card.id}`}
          role="alert"
          className="text-ui text-[var(--danger)]"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          role="status"
          aria-live="polite"
          className="text-metadata text-muted-foreground"
        >
          {savedNotice && !dirty ? messages.cardDetail.savedChanges : ''}
        </span>
        <Button type="submit" size="sm" disabled={saving || !dirty}>
          <Save className="size-3.5" />
          {saving ? messages.common.saving : messages.cardDetail.saveChanges}
        </Button>
      </div>
    </form>
  )
}
