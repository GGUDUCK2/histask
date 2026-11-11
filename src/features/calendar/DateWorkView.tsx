import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { BoardCardProjection } from '@/services/board-query'
import {
  computeDateWorkSummary,
  type DateWorkUpdatedItem,
} from '@/services/date-work'
import { CARD_STATUS_LABELS } from '@/types/domain'
import { CARD_STATUS_VISUAL, getClassificationMeta } from '@/utils/classification-styles'
import { cn } from '@/utils/cn'
import {
  formatDueDate,
  formatExactTime,
  formatRelativeTime,
  isDateOnly,
  parseLocalDate,
  toLocalDateKey,
} from '@/utils/dates'

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = parseLocalDate(dateKey)
  date.setDate(date.getDate() + deltaDays)
  return toLocalDateKey(date)
}

function CompactTaskSummaryRow({
  projection,
  subtitle,
  timestamp,
}: {
  projection: BoardCardProjection
  subtitle?: string
  timestamp?: string
}) {
  const { openCard } = useWorkspace()
  const { card, category, latestWorkLog } = projection
  const displaySubtitle = subtitle ?? latestWorkLog?.content
  const statusVisual = CARD_STATUS_VISUAL[card.status]

  return (
    <button
      type="button"
      onClick={(event) => openCard(card.id, event.currentTarget)}
      className="grid w-full gap-1 rounded-card border bg-surface p-3 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-surface-subtle/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-card-title text-foreground">{card.title}</span>
        <div className="flex items-center gap-1.5">
          {category && (
            <span className="inline-flex items-center gap-1 text-metadata text-secondary-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 rounded-full',
                  getClassificationMeta(category.color).dotClass,
                )}
              />
              {category.name}
            </span>
          )}
          <span
            className={cn(
              'rounded-tag border px-1.5 py-0 text-tag font-medium',
              statusVisual.badgeClass,
            )}
          >
            {CARD_STATUS_LABELS[card.status]}
          </span>
        </div>
      </div>

      {displaySubtitle ? (
        <p className="line-clamp-2 text-ui text-secondary-foreground break-words whitespace-pre-line">
          {displaySubtitle}
        </p>
      ) : (
        <p className="text-metadata text-muted-foreground">No progress log yet</p>
      )}

      {timestamp && (
        <span
          title={formatExactTime(timestamp)}
          className="text-metadata text-muted-foreground"
        >
          {formatRelativeTime(timestamp)} · {formatExactTime(timestamp)}
        </span>
      )}
    </button>
  )
}

export function DateWorkView() {
  const { dateKey: routeDateKey } = useParams()
  const navigate = useNavigate()
  const { snapshot, snapshotStatus } = useWorkspace()

  const validDateKey =
    routeDateKey && isDateOnly(routeDateKey)
      ? routeDateKey
      : toLocalDateKey(new Date())

  const summary = useMemo(
    () => computeDateWorkSummary(snapshot, validDateKey),
    [snapshot, validDateKey],
  )

  const totalOnDate =
    summary.due.length + summary.updated.length + summary.completed.length

  const formattedTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(
        parseLocalDate(validDateKey),
      ),
    [validDateKey],
  )

  return (
    <section aria-labelledby="date-view-heading" className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <div className="flex items-center gap-2 text-metadata text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>Date activity ({formatDueDate(validDateKey)})</span>
          </div>
          <h1 id="date-view-heading" className="text-page-title font-semibold">
            {formattedTitle}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous day"
            onClick={() => navigate(`/date/${shiftDateKey(validDateKey, -1)}`)}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/today">Today</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next day"
            onClick={() => navigate(`/date/${shiftDateKey(validDateKey, 1)}`)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {routeDateKey && !isDateOnly(routeDateKey) && (
        <div
          role="alert"
          className="rounded-card border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2 text-ui"
        >
          Invalid calendar date &ldquo;{routeDateKey}&rdquo;. Showing today&apos;s
          date instead.
        </div>
      )}

      {snapshotStatus === 'loading' ? (
        <div className="rounded-card border bg-surface p-6 text-ui text-muted-foreground">
          Loading local history for {validDateKey}...
        </div>
      ) : totalOnDate === 0 ? (
        <div className="grid justify-items-start gap-2 rounded-card border bg-surface p-6">
          <h2 className="text-card-title font-semibold text-foreground">
            No tasks recorded on {formatDueDate(validDateKey)}
          </h2>
          <p className="text-ui text-muted-foreground">
            No tasks had a due date, WorkLog update, or completion on this day.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/all">Back to All Tasks</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5">
          <section aria-labelledby="date-due-heading" className="grid gap-2">
            <h2
              id="date-due-heading"
              className="text-ui font-semibold text-secondary-foreground"
            >
              Due ({summary.due.length})
            </h2>
            {summary.due.length === 0 ? (
              <p className="text-metadata text-muted-foreground">
                No tasks due on this date.
              </p>
            ) : (
              <div className="grid gap-2">
                {summary.due.map((projection) => (
                  <CompactTaskSummaryRow
                    key={projection.card.id}
                    projection={projection}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="date-updated-heading" className="grid gap-2">
            <h2
              id="date-updated-heading"
              className="text-ui font-semibold text-secondary-foreground"
            >
              Updated ({summary.updated.length})
            </h2>
            {summary.updated.length === 0 ? (
              <p className="text-metadata text-muted-foreground">
                No WorkLogs created on this date.
              </p>
            ) : (
              <div className="grid gap-2">
                {summary.updated.map((item: DateWorkUpdatedItem) => (
                  <CompactTaskSummaryRow
                    key={item.projection.card.id}
                    projection={item.projection}
                    subtitle={
                      item.dayWorkLogs.length > 1
                        ? `${item.latestDayWorkLog.content} (+${item.dayWorkLogs.length - 1} more log${item.dayWorkLogs.length - 1 === 1 ? '' : 's'} this day)`
                        : item.latestDayWorkLog.content
                    }
                    timestamp={item.latestDayWorkLog.createdAt}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="date-completed-heading" className="grid gap-2">
            <h2
              id="date-completed-heading"
              className="text-ui font-semibold text-secondary-foreground"
            >
              Completed ({summary.completed.length})
            </h2>
            {summary.completed.length === 0 ? (
              <p className="text-metadata text-muted-foreground">
                No tasks completed on this date.
              </p>
            ) : (
              <div className="grid gap-2">
                {summary.completed.map((projection) => (
                  <CompactTaskSummaryRow
                    key={projection.card.id}
                    projection={projection}
                    timestamp={projection.card.completedAt}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
