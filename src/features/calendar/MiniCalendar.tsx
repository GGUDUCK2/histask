import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useI18n } from '@/app/language-context'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { computeMonthActivityIndicators } from '@/services/date-work'
import { cn } from '@/utils/cn'
import { isDateOnly, parseLocalDate, toLocalDateKey } from '@/utils/dates'

interface CalendarCell {
  date: Date
  dateKey: string
  inMonth: boolean
}

function buildMonthGrid(year: number, monthIndex: number): CalendarCell[][] {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, monthIndex, 1 - startOffset)

  const weeks: CalendarCell[][] = []
  const cursor = new Date(gridStart)

  for (let week = 0; week < 6; week += 1) {
    const row: CalendarCell[] = []
    for (let day = 0; day < 7; day += 1) {
      const cellDate = new Date(cursor)
      row.push({
        date: cellDate,
        dateKey: toLocalDateKey(cellDate),
        inMonth: cellDate.getMonth() === monthIndex,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(row)
    if (cursor.getMonth() !== monthIndex && week >= 4) {
      break
    }
  }

  return weeks
}

export function MiniCalendar({ onNavigate }: { onNavigate?: () => void }) {
  const { intlLocale, messages } = useI18n()
  const { snapshot } = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()

  const selectedDateKey = useMemo(() => {
    const match = /^\/date\/([^/]+)/.exec(location.pathname)
    return match && isDateOnly(match[1]) ? match[1] : null
  }, [location.pathname])

  const todayKey = toLocalDateKey(new Date())

  const [manualMonth, setManualMonth] = useState<{
    routeKey: string | null
    year: number
    month: number
  } | null>(null)

  const [manualFocusedKey, setManualFocusedKey] = useState<{
    routeKey: string | null
    dateKey: string
  } | null>(null)

  const pendingFocusKeyRef = useRef<string | null>(null)
  const cellButtonsRef = useRef(new Map<string, HTMLButtonElement>())

  const viewMonth = useMemo(() => {
    if (manualMonth && manualMonth.routeKey === selectedDateKey) {
      return { year: manualMonth.year, month: manualMonth.month }
    }
    const base = selectedDateKey ? parseLocalDate(selectedDateKey) : new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  }, [manualMonth, selectedDateKey])

  const focusedDateKey =
    manualFocusedKey && manualFocusedKey.routeKey === selectedDateKey
      ? manualFocusedKey.dateKey
      : (selectedDateKey ?? todayKey)

  useEffect(() => {
    if (!pendingFocusKeyRef.current) return
    const targetKey = pendingFocusKeyRef.current
    pendingFocusKeyRef.current = null
    cellButtonsRef.current.get(targetKey)?.focus()
  }, [viewMonth, focusedDateKey])

  const indicators = useMemo(
    () =>
      computeMonthActivityIndicators(snapshot, viewMonth.year, viewMonth.month),
    [snapshot, viewMonth.month, viewMonth.year],
  )

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth.month, viewMonth.year],
  )

  const visibleKeys = useMemo(() => {
    const set = new Set<string>()
    for (const row of weeks) {
      for (const cell of row) {
        set.add(cell.dateKey)
      }
    }
    return set
  }, [weeks])

  const activeRovingKey = visibleKeys.has(focusedDateKey)
    ? focusedDateKey
    : (weeks[0]?.find((cell) => cell.inMonth)?.dateKey ?? weeks[0]?.[0]?.dateKey)

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: 'long',
        year: 'numeric',
      }).format(new Date(viewMonth.year, viewMonth.month, 1)),
    [intlLocale, viewMonth.month, viewMonth.year],
  )

  function shiftMonth(delta: number) {
    const next = new Date(viewMonth.year, viewMonth.month + delta, 1)
    setManualMonth({
      routeKey: selectedDateKey,
      year: next.getFullYear(),
      month: next.getMonth(),
    })
    setManualFocusedKey({
      routeKey: selectedDateKey,
      dateKey: toLocalDateKey(next),
    })
  }

  function handleDayKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) {
    let dayDelta = 0
    if (event.key === 'ArrowLeft') dayDelta = -1
    else if (event.key === 'ArrowRight') dayDelta = 1
    else if (event.key === 'ArrowUp') dayDelta = -7
    else if (event.key === 'ArrowDown') dayDelta = 7
    else if (event.key === 'Home') dayDelta = -date.getDay()
    else if (event.key === 'End') dayDelta = 6 - date.getDay()
    else return

    event.preventDefault()
    const target = new Date(date)
    target.setDate(target.getDate() + dayDelta)
    const targetKey = toLocalDateKey(target)
    pendingFocusKeyRef.current = targetKey
    setManualFocusedKey({
      routeKey: selectedDateKey,
      dateKey: targetKey,
    })
    if (
      target.getFullYear() !== viewMonth.year ||
      target.getMonth() !== viewMonth.month
    ) {
      setManualMonth({
        routeKey: selectedDateKey,
        year: target.getFullYear(),
        month: target.getMonth(),
      })
    }
  }

  return (
    <section aria-labelledby="mini-calendar-heading" className="grid gap-2">
      <div className="flex items-center justify-between gap-1">
        <h2
          id="mini-calendar-heading"
          className="text-metadata font-semibold text-foreground"
        >
          {monthTitle}
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={messages.calendar.previousMonth}
            onClick={() => shiftMonth(-1)}
            className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={messages.calendar.nextMonth}
            onClick={() => shiftMonth(1)}
            className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        role="grid"
        aria-label={monthTitle}
        className="grid gap-0.5 rounded-card border bg-surface p-1.5"
      >
        <div role="row" className="grid grid-cols-7 text-center">
          {messages.calendar.weekdays.map((weekday, index) => (
            <div
              key={index}
              role="columnheader"
              className="py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {weekday}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-7 gap-y-0.5">
            {week.map((cell) => {
              const indicator = indicators.get(cell.dateKey)
              const isToday = cell.dateKey === todayKey
              const isSelected = cell.dateKey === selectedDateKey
              const isRovingTarget = cell.dateKey === activeRovingKey

              const fullDateLabel = new Intl.DateTimeFormat(intlLocale, {
                dateStyle: 'long',
              }).format(cell.date)
              const activityParts: string[] = []
              if (indicator?.hasDue) {
                activityParts.push(messages.calendar.indicatorDue)
              }
              if (indicator?.hasWorkLog) {
                activityParts.push(messages.calendar.indicatorWorkLog)
              }
              if (indicator?.hasCompleted) {
                activityParts.push(messages.calendar.indicatorCompleted)
              }

              const cellAriaLabel =
                activityParts.length > 0
                  ? `${fullDateLabel}: ${activityParts.join(', ')}`
                  : fullDateLabel

              return (
                <div
                  key={cell.dateKey}
                  role="gridcell"
                  aria-selected={isSelected}
                  className="flex justify-center"
                >
                  <button
                    ref={(node) => {
                      if (node) cellButtonsRef.current.set(cell.dateKey, node)
                      else cellButtonsRef.current.delete(cell.dateKey)
                    }}
                    type="button"
                    tabIndex={isRovingTarget ? 0 : -1}
                    aria-label={cellAriaLabel}
                    onClick={() => {
                      setManualFocusedKey({
                        routeKey: cell.dateKey,
                        dateKey: cell.dateKey,
                      })
                      navigate(`/date/${cell.dateKey}`)
                      onNavigate?.()
                    }}
                    onKeyDown={(event) => handleDayKeyDown(event, cell.date)}
                    className={cn(
                      'flex h-7 w-7 flex-col items-center justify-center rounded-control text-[11px] leading-none transition-colors',
                      cell.inMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground/55',
                      isToday && !isSelected && 'ring-1 ring-[var(--accent)]',
                      isSelected
                        ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]'
                        : 'hover:bg-surface-hover',
                    )}
                  >
                    <span>{cell.date.getDate()}</span>
                    <span className="mt-0.5 flex h-1 items-center gap-0.5">
                      {indicator?.hasDue && (
                        <span
                          aria-hidden="true"
                          className="size-1 rounded-full bg-[var(--warning)]"
                        />
                      )}
                      {indicator?.hasWorkLog && (
                        <span
                          aria-hidden="true"
                          className="size-1 rounded-full bg-[var(--accent)]"
                        />
                      )}
                      {indicator?.hasCompleted && (
                        <span
                          aria-hidden="true"
                          className="size-1 rounded-full bg-[var(--success)]"
                        />
                      )}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
