import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import type { BoardCardProjection } from '@/services/board-query'
import type { CardStatus } from '@/types/domain'
import { CARD_STATUS_VISUAL } from '@/utils/classification-styles'
import { cn } from '@/utils/cn'
import { InlineQuickAdd } from './QuickAddCard'
import { SortableTaskCard } from './TaskCard'
import { columnDroppableId } from './useBoardDnd'

export function KanbanColumn({
  status,
  cards,
  quickAddOpen,
  onToggleQuickAdd,
  onMoveStep,
  onMoveStatus,
  dndDisabled = false,
  className,
}: {
  status: CardStatus
  cards: readonly BoardCardProjection[]
  quickAddOpen: boolean
  onToggleQuickAdd: (open: boolean) => void
  onMoveStep: (cardId: string, direction: 'up' | 'down') => void
  onMoveStatus: (cardId: string, targetStatus: CardStatus) => void
  dndDisabled?: boolean
  className?: string
}) {
  const { messages } = useI18n()
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(status),
    disabled: dndDisabled,
    data: { status },
  })
  const label = messages.statuses[status]
  const visual = CARD_STATUS_VISUAL[status]

  return (
    <section
      aria-label={messages.board.columnAria(label, cards.length)}
      className={cn(
        'flex min-h-[260px] flex-col rounded-card border bg-surface-subtle/70',
        isOver && 'border-[var(--accent)]/60 bg-[var(--accent-soft)]/30',
        className,
      )}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={cn('size-2 shrink-0 rounded-full', visual.dotClass)}
          />
          <h2 className="truncate text-ui font-semibold text-foreground">
            {label}
          </h2>
          <span className="rounded-tag border bg-surface px-1.5 py-0 text-tag font-medium text-muted-foreground tabular-nums">
            {cards.length}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={messages.board.addTaskToColumn(label)}
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => onToggleQuickAdd(!quickAddOpen)}
        >
          <Plus className="size-3.5" />
        </Button>
      </header>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain p-2 md:max-h-[calc(100svh-18rem)]"
      >
        {quickAddOpen && (
          <InlineQuickAdd
            status={status}
            onCancel={() => onToggleQuickAdd(false)}
            onCreated={() => onToggleQuickAdd(false)}
          />
        )}

        <SortableContext
          items={cards.map(({ card }) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-card border border-dashed border-border px-3 py-6 text-center text-metadata text-muted-foreground">
              <span>{messages.board.emptyColumn(label)}</span>
            </div>
          ) : (
            cards.map((projection, index) => (
              <SortableTaskCard
                key={projection.card.id}
                projection={projection}
                canMoveUp={index > 0}
                canMoveDown={index < cards.length - 1}
                onMoveStep={onMoveStep}
                onMoveStatus={onMoveStatus}
                dndDisabled={dndDisabled}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  )
}
