import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/features/workspace/workspace-context'
import type { BoardCardProjection } from '@/services/board-query'
import { millisecondsUntilNextLocalDay } from '@/services/dashboard'
import { computeDateWorkSummary } from '@/services/date-work'
import { CARD_STATUS_LABELS, PRIORITY_LABELS } from '@/types/domain'
import {
  CARD_STATUS_VISUAL,
  getClassificationMeta,
  PRIORITY_VISUAL,
} from '@/utils/classification-styles'
import { cn } from '@/utils/cn'
import {
  formatExactTime,
  formatRelativeTime,
  parseLocalDate,
  toLocalDateKey,
} from '@/utils/dates'

function TodayTaskItem({
  projection,
  excerpt,
  timestamp,
  extraMeta,
}: {
  projection: BoardCardProjection
  excerpt?: string
  timestamp?: string
  extraMeta?: string
}) {
  const { openCard } = useWorkspace()
  const { card, category, latestWorkLog } = projection
  const displayExcerpt = excerpt ?? latestWorkLog?.content
  const statusVisual = CARD_STATUS_VISUAL[card.status]

  return (
    <button
      type="button"
      onClick={(event) => openCard(card.id, event.currentTarget)}
      className="grid w-full gap-1.5 rounded-card border bg-surface p-3 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-surface-subtle/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-card-title text-foreground">{card.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
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
          {card.priority !== 'NONE' && (
            <span
              className={cn(
                'rounded-tag border px-1.5 py-0 text-tag font-medium',
                PRIORITY_VISUAL[card.priority].badgeClass,
              )}
            >
              {PRIORITY_LABELS[card.priority]}
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

      {displayExcerpt ? (
        <p className="line-clamp-2 rounded-r-control border-l-2 border-[var(--accent)]/40 bg-surface-subtle/60 px-2.5 py-1 text-ui text-foreground/90 break-words whitespace-pre-line">
          {displayExcerpt}
        </p>
      ) : (
        <p className="text-metadata text-muted-foreground">No progress log yet</p>
      )}

      {(timestamp || extraMeta) && (
        <div className="flex flex-wrap items-center gap-2 text-metadata text-muted-foreground">
          {timestamp && (
            <span title={formatExactTime(timestamp)}>
              {formatRelativeTime(timestamp)} · {formatExactTime(timestamp)}
            </span>
          )}
          {extraMeta && <span>{extraMeta}</span>}
        </div>
      )}
    </button>
  )
}

export function TodayPage() {
  const { snapshot, snapshotStatus, openQuickCreate } = useWorkspace()
  const [todayKey, setTodayKey] = useState(() => toLocalDateKey(new Date()))

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined

    function syncDay() {
      const nextKey = toLocalDateKey(new Date())
      setTodayKey((previous) => (previous === nextKey ? previous : nextKey))
    }

    function scheduleMidnightTick() {
      const delay = millisecondsUntilNextLocalDay(new Date())
      timerId = setTimeout(() => {
        syncDay()
        scheduleMidnightTick()
      }, delay)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        syncDay()
      }
    }

    scheduleMidnightTick()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      if (timerId !== undefined) clearTimeout(timerId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const summary = useMemo(
    () => computeDateWorkSummary(snapshot, todayKey),
    [snapshot, todayKey],
  )

  const todayFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(
        parseLocalDate(todayKey),
      ),
    [todayKey],
  )

  const totalTodayCount =
    summary.due.length +
    summary.updated.length +
    summary.completed.length +
    summary.created.length

  return (
    <section aria-labelledby="today-heading" className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <div className="flex items-center gap-2 text-metadata text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{todayFormatted}</span>
          </div>
          <h1 id="today-heading" className="text-page-title font-semibold">
            Today
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={(event) => openQuickCreate('TODO', event.currentTarget)}
          >
            <Plus className="size-4" />
            New task
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/all">Open Board</Link>
          </Button>
        </div>
      </div>

      {snapshotStatus === 'loading' ? (
        <div className="rounded-card border bg-surface p-6 text-ui text-muted-foreground">
          Loading today&apos;s activity...
        </div>
      ) : totalTodayCount === 0 ? (
        <div className="grid justify-items-start gap-2 rounded-card border bg-surface p-6">
          <h2 className="text-card-title font-semibold text-foreground">
            Nothing due, updated, or completed today
          </h2>
          <p className="text-ui text-muted-foreground">
            Create a task or log progress on an active card to see today&apos;s
            summary here.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={(event) => openQuickCreate('TODO', event.currentTarget)}
            >
              <Plus className="size-4" />
              Create task
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/all">View All Tasks</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:max-w-4xl">
          <section aria-labelledby="today-due-heading" className="grid gap-2">
            <h2
              id="today-due-heading"
              className="text-ui font-semibold text-secondary-foreground"
            >
              Due Today ({summary.due.length})
            </h2>
            {summary.due.length === 0 ? (
              <p className="text-metadata text-muted-foreground">
                No tasks due today.
              </p>
            ) : (
              <div className="grid gap-2">
                {summary.due.map((projection) => (
                  <TodayTaskItem
                    key={projection.card.id}
                    projection={projection}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="today-updated-heading" className="grid gap-2">
            <h2
              id="today-updated-heading"
              className="text-ui font-semibold text-secondary-foreground"
            >
              Updated Today ({summary.updated.length})
            </h2>
            {summary.updated.length === 0 ? (
              <p className="text-metadata text-muted-foreground">
                No WorkLogs recorded yet today.
              </p>
            ) : (
              <div className="grid gap-2">
                {summary.updated.map((item) => (
                  <TodayTaskItem
                    key={item.projection.card.id}
                    projection={item.projection}
                    excerpt={item.latestDayWorkLog.content}
                    timestamp={item.latestDayWorkLog.createdAt}
                    extraMeta={
                      item.dayWorkLogs.length > 1
                        ? `${item.dayWorkLogs.length} logs today`
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="today-completed-heading" className="grid gap-2">
            <h2
              id="today-completed-heading"
              className="text-ui font-semibold text-secondary-foreground"
            >
              Completed Today ({summary.completed.length})
            </h2>
            {summary.completed.length === 0 ? (
              <p className="text-metadata text-muted-foreground">
                No tasks completed today.
              </p>
            ) : (
              <div className="grid gap-2">
                {summary.completed.map((projection) => (
                  <TodayTaskItem
                    key={projection.card.id}
                    projection={projection}
                    timestamp={projection.card.completedAt}
                  />
                ))}
              </div>
            )}
          </section>

          {summary.created.length > 0 && (
            <section
              aria-labelledby="today-created-heading"
              className="grid gap-2 border-t pt-4"
            >
              <h2
                id="today-created-heading"
                className="text-ui font-semibold text-muted-foreground"
              >
                Created Today ({summary.created.length})
              </h2>
              <div className="grid gap-2">
                {summary.created.map((projection) => (
                  <TodayTaskItem
                    key={projection.card.id}
                    projection={projection}
                    timestamp={projection.card.createdAt}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  )
}
