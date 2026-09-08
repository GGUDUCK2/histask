import type { Card } from '@/types/domain'

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    )
  if (!match || !isDateOnly(match[1])) return false
  if (+match[2] > 23 || +match[3] > 59 || +match[4] > 59) return false
  if (
    match[5] !== 'Z' &&
    (+match[5].slice(1, 3) > 23 || +match[5].slice(4) > 59)
  )
    return false
  return Number.isFinite(Date.parse(value))
}

function requireDate(date: Date): Date {
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid date')
  return date
}

export function toLocalDateKey(date: Date = new Date()): string {
  requireDate(date)
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Never parse a date-only string as UTC: a due day has no time or timezone. */
export function parseLocalDate(value: string): Date {
  if (!isDateOnly(value)) throw new RangeError('Invalid calendar date')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(year, month - 1, day)
  return date
}

export function localDayRange(day: Date = new Date()): {
  start: string
  end: string
} {
  const start = new Date(requireDate(day))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function isOnLocalDay(
  timestamp: string,
  day: Date = new Date(),
): boolean {
  if (!isIsoTimestamp(timestamp)) throw new RangeError('Invalid timestamp')
  const { start, end } = localDayRange(day)
  const time = Date.parse(timestamp)
  return time >= Date.parse(start) && time < Date.parse(end)
}

export function formatExactTime(timestamp: string, locale?: string): string {
  if (!isIsoTimestamp(timestamp)) throw new RangeError('Invalid timestamp')
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'long',
  }).format(new Date(timestamp))
}

export function formatDueDate(value: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    parseLocalDate(value),
  )
}

export function formatRelativeTime(
  timestamp: string,
  now: Date = new Date(),
  locale?: string,
): string {
  if (!isIsoTimestamp(timestamp)) throw new RangeError('Invalid timestamp')
  const date = new Date(timestamp)
  const seconds = (date.getTime() - requireDate(now).getTime()) / 1000
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (Math.abs(seconds) < 60) return format.format(0, 'second')
  // Calendar distance makes "yesterday" stable across midnight and DST.
  const calendarNumber = (value: Date) => {
    const utc = new Date(0)
    utc.setUTCFullYear(value.getFullYear(), value.getMonth(), value.getDate())
    utc.setUTCHours(0, 0, 0, 0)
    return utc.getTime() / 86_400_000
  }
  const days = calendarNumber(date) - calendarNumber(now)
  if (days !== 0) return format.format(days, 'day')
  if (Math.abs(seconds) < 3600)
    return format.format(Math.trunc(seconds / 60), 'minute')
  return format.format(Math.trunc(seconds / 3600), 'hour')
}

export type DueUrgency = 'none' | 'future' | 'today' | 'overdue' | 'completed'
export function getDueUrgency(
  card: Pick<Card, 'status' | 'dueDate'>,
  now: Date = new Date(),
): DueUrgency {
  if (!card.dueDate) return 'none'
  if (!isDateOnly(card.dueDate)) throw new RangeError('Invalid due date')
  const today = toLocalDateKey(now)
  if (card.status === 'DONE') return 'completed'
  return card.dueDate < today
    ? 'overdue'
    : card.dueDate === today
      ? 'today'
      : 'future'
}

/** Staleness is elapsed age in 24-hour days, independent of calendar grouping. */
export function isStale(
  card: Pick<Card, 'updatedAt'>,
  days: number,
  now: Date = new Date(),
): boolean {
  if (!Number.isInteger(days) || days < 0)
    throw new RangeError('Days must be a non-negative integer')
  if (!isIsoTimestamp(card.updatedAt)) throw new RangeError('Invalid timestamp')
  const age = requireDate(now).getTime() - Date.parse(card.updatedAt)
  return age >= 0 && age >= days * 86_400_000
}
