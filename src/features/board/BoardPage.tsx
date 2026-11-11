import { useMemo, useState } from 'react'
import { closestCorners, DndContext, DragOverlay } from '@dnd-kit/core'
import { AlertCircle, Info, Plus, RotateCcw, Upload } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { MetricsRow } from '@/features/dashboard/MetricsRow'
import { FilterSortBar } from '@/features/filters/FilterSortBar'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { BoardCardProjection } from '@/services/board-query'
import {
  CARD_SORT_LABELS,
} from '@/types/card-query'
import {
  CARD_STATUSES,
  CARD_STATUS_LABELS,
  type CardStatus,
} from '@/types/domain'
import { KanbanColumn } from './KanbanColumn'
import { TaskCardContent } from './TaskCard'
import { useBoardDnd } from './useBoardDnd'

export type BoardRouteView = 'all' | 'inProgress' | 'waiting' | 'completed'

const VIEW_METADATA: Record<
  BoardRouteView,
  {
    title: string
    subtitle: string
    status?: CardStatus
  }
> = {
  all: {
    title: 'All Tasks',
    subtitle: 'Track task progress across statuses with the latest WorkLog on every card.',
  },
  inProgress: {
    title: 'In Progress',
    subtitle: 'Tasks actively moving forward right now.',
    status: 'IN_PROGRESS',
  },
  waiting: {
    title: 'Waiting',
    subtitle: 'Tasks paused on external feedback, reviews, or dependencies.',
    status: 'WAITING',
  },
  completed: {
    title: 'Completed',
    subtitle: 'Finished tasks with recorded completion history.',
    status: 'DONE',
  },
}

export function BoardPage({ view }: { view: BoardRouteView }) {
  const {
    snapshot,
    snapshotStatus,
    visibleCards,
    services,
    sortMode,
    hasAnyFilterOrSearch,
    clearFiltersAndSearch,
    filters,
    openQuickCreate,
    boardError,
    setBoardError,
  } = useWorkspace()

  const [quickAddColumn, setQuickAddColumn] = useState<CardStatus | null>(null)
  const viewInfo = VIEW_METADATA[view]
  const focusedStatus = viewInfo.status

  const cardsByStatus = useMemo(() => {
    const grouped: Record<CardStatus, BoardCardProjection[]> = {
      TODO: [],
      IN_PROGRESS: [],
      WAITING: [],
      DONE: [],
    }
    for (const projection of visibleCards) {
      grouped[projection.card.status].push(projection)
    }
    return grouped
  }, [visibleCards])

  const {
    sensors,
    displayedColumns,
    activeProjection,
    dndNotice,
    setDndNotice,
    hasRetryableMove,
    retryFailedMove,
    dismissError,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleMoveStep,
    handleMoveStatus,
  } = useBoardDnd({
    cardsByStatus,
    sortMode,
    services,
    onError: setBoardError,
  })

  const isStatusView = focusedStatus !== undefined
  const displayedStatuses: readonly CardStatus[] = isStatusView
    ? [focusedStatus]
    : filters.status
      ? [filters.status]
      : CARD_STATUSES

  const totalDisplayed = displayedStatuses.reduce(
    (sum, status) => sum + displayedColumns[status].length,
    0,
  )
  const totalInViewBase = isStatusView
    ? snapshot.cards.filter(({ card }) => card.status === focusedStatus).length
    : snapshot.cards.length

  if (snapshotStatus === 'error') {
    return (
      <section aria-labelledby="board-heading" className="grid gap-4">
        <h1 id="board-heading" className="text-page-title font-semibold">
          {viewInfo.title}
        </h1>
        <div
          role="alert"
          className="flex items-center gap-2 rounded-card border border-[var(--danger)]/35 bg-[var(--danger)]/8 p-4 text-ui text-[var(--danger)]"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Could not load tasks from local IndexedDB storage. Refresh the page
            or verify storage status in Settings.
          </span>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="board-heading" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-0.5">
          <h1 id="board-heading" className="text-page-title font-semibold">
            {viewInfo.title}
          </h1>
          <p className="text-ui text-muted-foreground">{viewInfo.subtitle}</p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={(event) =>
            openQuickCreate(focusedStatus ?? 'TODO', event.currentTarget)
          }
        >
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      {view === 'all' && <MetricsRow />}

      <FilterSortBar hideStatusFilter={isStatusView} />

      {sortMode !== 'manual' && (
        <div className="flex items-center gap-2 rounded-card border bg-surface-subtle px-3 py-2 text-metadata text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          <span>
            Sorted by <strong>{CARD_SORT_LABELS[sortMode]}</strong>.
            Within-column manual reordering is disabled in this mode
            {!isStatusView ? '; dragging across columns still updates status.' : '.'}
          </span>
        </div>
      )}

      {dndNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 rounded-card border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2 text-ui text-foreground"
        >
          <span>{dndNotice}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDndNotice(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {boardError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-[var(--danger)]/35 bg-[var(--danger)]/8 px-3 py-2 text-ui text-[var(--danger)]"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{boardError}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasRetryableMove && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={retryFailedMove}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={dismissError}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {snapshotStatus === 'loading' ? (
        <div className="rounded-card border bg-surface p-6 text-ui text-muted-foreground">
          Loading local tasks...
        </div>
      ) : totalInViewBase === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-card border bg-surface p-6">
          <div className="grid gap-1">
            <h2 className="text-card-title font-semibold text-foreground">
              {isStatusView
                ? `No ${CARD_STATUS_LABELS[focusedStatus].toLowerCase()} tasks yet`
                : 'No tasks yet'}
            </h2>
            <p className="text-ui text-muted-foreground">
              Create your first task or restore an existing Histask backup
              stored on this device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={(event) =>
                openQuickCreate(focusedStatus ?? 'TODO', event.currentTarget)
              }
            >
              <Plus className="size-4" />
              Create task
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">
                <Upload className="size-4" />
                Import backup
              </Link>
            </Button>
          </div>
        </div>
      ) : totalDisplayed === 0 && (hasAnyFilterOrSearch || filters.status) ? (
        <div className="grid justify-items-start gap-3 rounded-card border bg-surface p-6">
          <div className="grid gap-1">
            <h2 className="text-card-title font-semibold text-foreground">
              No matching tasks
            </h2>
            <p className="text-ui text-muted-foreground">
              No active tasks match your current search query or selected
              filters.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFiltersAndSearch}
          >
            <RotateCcw className="size-3.5" />
            Clear all filters
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            className={
              displayedStatuses.length === 1
                ? 'grid grid-cols-1 gap-3 lg:max-w-3xl'
                : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'
            }
          >
            {displayedStatuses.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                cards={displayedColumns[status]}
                quickAddOpen={quickAddColumn === status}
                onToggleQuickAdd={(open) =>
                  setQuickAddColumn(open ? status : null)
                }
                onMoveStep={handleMoveStep}
                onMoveStatus={handleMoveStatus}
                dndDisabled={displayedStatuses.length === 1 && sortMode !== 'manual'}
              />
            ))}
          </div>

          <DragOverlay>
            {activeProjection ? (
              <div className="w-[290px] rotate-1">
                <TaskCardContent projection={activeProjection} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  )
}
