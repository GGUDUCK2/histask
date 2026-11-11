import { useMemo, useState } from 'react'
import { closestCorners, DndContext, DragOverlay } from '@dnd-kit/core'
import { AlertCircle, Info, Plus, RotateCcw, Upload } from 'lucide-react'
import { Link } from 'react-router'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import { MetricsRow } from '@/features/dashboard/MetricsRow'
import { FilterSortBar } from '@/features/filters/FilterSortBar'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { BoardCardProjection } from '@/services/board-query'
import {
  CARD_STATUSES,
  type CardStatus,
} from '@/types/domain'
import { KanbanColumn } from './KanbanColumn'
import { TaskCardContent } from './TaskCard'
import { useBoardDnd } from './useBoardDnd'

export type BoardRouteView = 'all' | 'inProgress' | 'waiting' | 'completed'

const VIEW_STATUS_MAP: Record<BoardRouteView, CardStatus | undefined> = {
  all: undefined,
  inProgress: 'IN_PROGRESS',
  waiting: 'WAITING',
  completed: 'DONE',
}

export function BoardPage({ view }: { view: BoardRouteView }) {
  const { messages } = useI18n()
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
  const viewInfo = messages.board.views[view]
  const focusedStatus = VIEW_STATUS_MAP[view]

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
            {messages.board.loadError}
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
          {messages.appShell.newTask}
        </Button>
      </div>

      {view === 'all' && <MetricsRow />}

      <FilterSortBar hideStatusFilter={isStatusView} />

      {sortMode !== 'manual' && (
        <div className="flex items-center gap-2 rounded-card border bg-surface-subtle px-3 py-2 text-metadata text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          <span>
            {messages.board.sortedNoticePrefix}{' '}
            <strong>{messages.sortModes[sortMode]}</strong>.{' '}
            {isStatusView
              ? messages.board.sortedNoticeBodySingle
              : messages.board.sortedNoticeBodyMulti}
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
            {messages.common.dismiss}
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
                {messages.common.retry}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={dismissError}
            >
              {messages.common.dismiss}
            </Button>
          </div>
        </div>
      )}

      {snapshotStatus === 'loading' ? (
        <div className="rounded-card border bg-surface p-6 text-ui text-muted-foreground">
          {messages.board.loadingTasks}
        </div>
      ) : totalInViewBase === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-card border bg-surface p-6">
          <div className="grid gap-1">
            <h2 className="text-card-title font-semibold text-foreground">
              {isStatusView
                ? messages.board.emptyStatusTitle(
                    messages.statuses[focusedStatus],
                  )
                : messages.board.emptyAllTitle}
            </h2>
            <p className="text-ui text-muted-foreground">
              {messages.board.emptyDescription}
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
              {messages.board.createTask}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">
                <Upload className="size-4" />
                {messages.board.importBackup}
              </Link>
            </Button>
          </div>
        </div>
      ) : totalDisplayed === 0 && (hasAnyFilterOrSearch || filters.status) ? (
        <div className="grid justify-items-start gap-3 rounded-card border bg-surface p-6">
          <div className="grid gap-1">
            <h2 className="text-card-title font-semibold text-foreground">
              {messages.board.noMatchingTitle}
            </h2>
            <p className="text-ui text-muted-foreground">
              {messages.board.noMatchingDescription}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFiltersAndSearch}
          >
            <RotateCcw className="size-3.5" />
            {messages.board.clearAllFilters}
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
