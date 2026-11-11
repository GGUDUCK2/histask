import { useState, type HTMLAttributes, type MouseEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  GripVertical,
  MessageSquareText,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { BoardCardProjection } from '@/services/board-query'
import {
  CARD_STATUSES,
  CARD_STATUS_LABELS,
  PRIORITY_LABELS,
  type CardStatus,
} from '@/types/domain'
import {
  DUE_URGENCY_VISUAL,
  getClassificationMeta,
  PRIORITY_VISUAL,
} from '@/utils/classification-styles'
import { cn } from '@/utils/cn'
import {
  formatDueDate,
  formatExactTime,
  formatRelativeTime,
  getDueUrgency,
} from '@/utils/dates'

interface TaskCardContentProps {
  projection: BoardCardProjection
  isDragging?: boolean
  isOverlay?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMoveStep?: (cardId: string, direction: 'up' | 'down') => void
  onMoveStatus?: (cardId: string, targetStatus: CardStatus) => void
  dragHandleAttributes?: HTMLAttributes<HTMLButtonElement>
  dragHandleListeners?: Record<string, unknown>
}

export function TaskCardContent({
  projection,
  isDragging = false,
  isOverlay = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveStep,
  onMoveStatus,
  dragHandleAttributes,
  dragHandleListeners,
}: TaskCardContentProps) {
  const { openCard, sortMode } = useWorkspace()
  const [menuOpen, setMenuOpen] = useState(false)
  const { card, category, tags, latestWorkLog, workLogCount } = projection

  const dueUrgency = getDueUrgency(card)
  const activityTimestamp = latestWorkLog?.createdAt ?? card.updatedAt
  const relativeActivity = formatRelativeTime(activityTimestamp)
  const exactActivity = formatExactTime(activityTimestamp)
  const visibleTags = tags.slice(0, 3)
  const extraTagCount = Math.max(0, tags.length - 3)
  const latestWasEdited =
    latestWorkLog !== undefined &&
    latestWorkLog.updatedAt > latestWorkLog.createdAt

  function handleArticleClick(event: MouseEvent<HTMLElement>) {
    if (isOverlay) return
    const target = event.target
    if (
      target instanceof Element &&
      target.closest('button, a, input, textarea, [data-card-interactive="true"]')
    ) {
      return
    }
    openCard(card.id, event.currentTarget)
  }

  return (
    <article
      aria-label={card.title}
      onClick={handleArticleClick}
      className={cn(
        'group grid gap-2 rounded-card border bg-surface p-3 text-left transition-colors',
        !isOverlay && 'hover:border-[var(--border-strong)]',
        isDragging && 'opacity-40',
        isOverlay && 'border-[var(--border-strong)] shadow-overlay',
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <h3 className="min-w-0 flex-1 text-card-title text-foreground">
          <button
            type="button"
            disabled={isOverlay}
            onClick={(event) => openCard(card.id, event.currentTarget)}
            className="w-full rounded-control text-left break-words hover:text-[var(--accent)] focus-visible:outline-none"
          >
            <span className="[display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
              {card.title}
            </span>
          </button>
        </h3>

        {!isOverlay && (
          <div className="flex shrink-0 items-center gap-0.5">
            {dragHandleAttributes && dragHandleListeners && (
              <button
                type="button"
                aria-label={`Drag ${card.title}`}
                data-card-interactive="true"
                className="inline-flex size-6 cursor-grab items-center justify-center rounded-control text-muted-foreground opacity-65 hover:bg-surface-hover hover:text-foreground focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
                {...dragHandleAttributes}
                {...dragHandleListeners}
              >
                <GripVertical className="size-3.5" />
              </button>
            )}

            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-card-interactive="true"
                  aria-label={`Task actions for ${card.title}`}
                  className="size-6 text-muted-foreground"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-1.5">
                <div className="grid gap-0.5 text-ui" data-card-interactive="true">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      openCard(card.id)
                    }}
                    className="flex h-7 items-center rounded-control px-2 text-left hover:bg-surface-hover"
                  >
                    Open details
                  </button>

                  {onMoveStatus && (
                    <>
                      <div className="my-1 border-t" />
                      <div className="px-2 py-0.5 text-metadata font-medium text-muted-foreground">
                        Move to status
                      </div>
                      {CARD_STATUSES.filter((status) => status !== card.status).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setMenuOpen(false)
                              onMoveStatus(card.id, status)
                            }}
                            className="flex h-7 items-center rounded-control px-2 text-left hover:bg-surface-hover"
                          >
                            {CARD_STATUS_LABELS[status]}
                          </button>
                        ),
                      )}
                    </>
                  )}

                  {onMoveStep && sortMode === 'manual' && (canMoveUp || canMoveDown) && (
                    <>
                      <div className="my-1 border-t" />
                      <div className="px-2 py-0.5 text-metadata font-medium text-muted-foreground">
                        Reorder
                      </div>
                      {canMoveUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            onMoveStep(card.id, 'up')
                          }}
                          className="flex h-7 items-center gap-1.5 rounded-control px-2 text-left hover:bg-surface-hover"
                        >
                          <ArrowUp className="size-3.5 text-muted-foreground" />
                          Move up
                        </button>
                      )}
                      {canMoveDown && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            onMoveStep(card.id, 'down')
                          }}
                          className="flex h-7 items-center gap-1.5 rounded-control px-2 text-left hover:bg-surface-hover"
                        >
                          <ArrowDown className="size-3.5 text-muted-foreground" />
                          Move down
                        </button>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {latestWorkLog ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={isOverlay}
              onClick={(event) => openCard(card.id, event.currentTarget)}
              aria-label={`Latest progress log: ${latestWorkLog.content}`}
              className="w-full rounded-r-control border-l-2 border-[var(--accent)]/45 bg-surface-subtle/80 px-2.5 py-1.5 text-left transition-colors hover:bg-surface-subtle"
            >
              <span className="text-ui text-foreground/90 whitespace-pre-line break-words [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                {latestWorkLog.content}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-sm">
            <div className="grid gap-1">
              <div className="flex items-center gap-1.5 text-metadata text-muted-foreground">
                <span>{formatExactTime(latestWorkLog.createdAt)}</span>
                {latestWasEdited && <span>(edited)</span>}
              </div>
              <p className="whitespace-pre-wrap break-words text-ui text-popover-foreground">
                {latestWorkLog.content}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <p className="rounded-r-control border-l-2 border-border bg-surface-subtle/50 px-2.5 py-1 text-metadata text-muted-foreground">
          No progress log yet
        </p>
      )}

      {(category || card.dueDate || card.priority !== 'NONE') && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-metadata">
          {category && (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-secondary-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  getClassificationMeta(category.color).dotClass,
                )}
              />
              <span className="truncate">{category.name}</span>
            </span>
          )}

          {card.priority !== 'NONE' && (
            <span
              className={cn(
                'inline-flex items-center rounded-tag border px-1.5 py-0 text-tag font-medium',
                PRIORITY_VISUAL[card.priority].badgeClass,
              )}
            >
              {PRIORITY_LABELS[card.priority]}
            </span>
          )}

          {card.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                DUE_URGENCY_VISUAL[dueUrgency],
              )}
            >
              <Calendar className="size-3 shrink-0" />
              <span>{formatDueDate(card.dueDate)}</span>
              {dueUrgency === 'overdue' && <span>(Overdue)</span>}
              {dueUrgency === 'today' && <span>(Today)</span>}
            </span>
          )}
        </div>
      )}

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className={cn(
                'inline-flex max-w-[140px] items-center truncate rounded-tag border px-1.5 py-0 text-tag font-medium',
                getClassificationMeta(tag.color).chipClass,
              )}
            >
              {tag.name}
            </span>
          ))}
          {extraTagCount > 0 && (
            <span className="rounded-tag border border-border px-1.5 py-0 text-tag text-muted-foreground">
              +{extraTagCount}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5 text-metadata text-muted-foreground">
        <span title={exactActivity}>{relativeActivity}</span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <MessageSquareText className="size-3" />
          <span>{workLogCount}</span>
        </span>
      </div>
    </article>
  )
}

export function SortableTaskCard({
  projection,
  canMoveUp,
  canMoveDown,
  onMoveStep,
  onMoveStatus,
  dndDisabled = false,
}: {
  projection: BoardCardProjection
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveStep: (cardId: string, direction: 'up' | 'down') => void
  onMoveStatus: (cardId: string, targetStatus: CardStatus) => void
  dndDisabled?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: projection.card.id,
    disabled: dndDisabled,
    data: {
      status: projection.card.status,
      cardId: projection.card.id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardContent
        projection={projection}
        isDragging={isDragging}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveStep={onMoveStep}
        onMoveStatus={onMoveStatus}
        dragHandleAttributes={dndDisabled ? undefined : attributes}
        dragHandleListeners={dndDisabled ? undefined : listeners}
      />
    </div>
  )
}
