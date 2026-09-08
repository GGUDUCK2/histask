import { describe, expect, it } from 'vitest'
import {
  formatDueDate,
  formatExactTime,
  formatRelativeTime,
  getDueUrgency,
  isDateOnly,
  isIsoTimestamp,
  isOnLocalDay,
  isStale,
  localDayRange,
  parseLocalDate,
  toLocalDateKey,
} from './dates'

describe('ISO validation', () => {
  it.each(['2028-02-29', '2026-12-31', '0001-01-01'])(
    'accepts real date %s',
    (value) => expect(isDateOnly(value)).toBe(true),
  )
  it.each([
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '2026-01-00',
    '2026-9-8',
    '0000-01-01',
    '',
    null,
    12,
  ])('rejects invalid date %s', (value) =>
    expect(isDateOnly(value)).toBe(false),
  )
  it.each(['2026-09-08T01:32:22.123Z', '2026-09-08T10:32:22+09:00'])(
    'accepts timestamp %s',
    (value) => expect(isIsoTimestamp(value)).toBe(true),
  )
  it.each([
    '2026-02-30T00:00:00Z',
    '2026-09-08',
    '2026-09-08T00:00:00',
    '2026-09-08T24:00:00Z',
    '2026-09-08T10:60:00Z',
    '2026-09-08T00:00:00+24:00',
    '2026-09-08T00:00:60Z',
    null,
  ])('rejects timestamp %s', (value) =>
    expect(isIsoTimestamp(value)).toBe(false),
  )
})
describe('local calendar boundaries', () => {
  it.each(['2026-12-31', '2028-02-29', '2026-09-08', '0099-01-01'])(
    'round trips date-only %s without UTC shift',
    (value) => {
      expect(toLocalDateKey(parseLocalDate(value))).toBe(value)
    },
  )
  it('uses a half-open interval across the year boundary', () => {
    const day = parseLocalDate('2026-12-31')
    const { start, end } = localDayRange(day)
    expect(isOnLocalDay(start, day)).toBe(true)
    expect(isOnLocalDay(new Date(Date.parse(end) - 1).toISOString(), day)).toBe(
      true,
    )
    expect(isOnLocalDay(end, day)).toBe(false)
    expect(toLocalDateKey(new Date(end))).toBe('2027-01-01')
  })
  it('uses the actual local midnight and 23/25-hour DST days', () => {
    const seoul =
      Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Seoul'
    const spring = localDayRange(parseLocalDate('2026-03-08'))
    const fall = localDayRange(parseLocalDate('2026-11-01'))
    expect((Date.parse(spring.end) - Date.parse(spring.start)) / 3600000).toBe(
      seoul ? 24 : 23,
    )
    expect((Date.parse(fall.end) - Date.parse(fall.start)) / 3600000).toBe(
      seoul ? 24 : 25,
    )
    expect(localDayRange(parseLocalDate('2026-09-08')).start).toBe(
      seoul ? '2026-09-07T15:00:00.000Z' : '2026-09-08T04:00:00.000Z',
    )
  })
})
describe('display and urgency', () => {
  const now = new Date(2026, 8, 8, 12)
  it('formats relative times, previous calendar day and future times', () => {
    const ago = (seconds: number) =>
      new Date(now.getTime() - seconds * 1000).toISOString()
    expect(formatRelativeTime(ago(10), now, 'en')).toBe('now')
    expect(formatRelativeTime(ago(600), now, 'en')).toBe('10 minutes ago')
    expect(formatRelativeTime(ago(7200), now, 'en')).toBe('2 hours ago')
    expect(
      formatRelativeTime(new Date(2026, 8, 7, 23).toISOString(), now, 'en'),
    ).toBe('yesterday')
    expect(formatRelativeTime(ago(3 * 86400), now, 'en')).toBe('3 days ago')
    expect(formatRelativeTime(ago(-600), now, 'en')).toBe('in 10 minutes')
    expect(formatRelativeTime(ago(600), now, 'ko')).toBe('10분 전')
  })
  it('formats exact dates/times in the requested locale', () => {
    expect(formatExactTime(now.toISOString(), 'en-US')).toMatch(/2026/)
    expect(formatExactTime(now.toISOString(), 'ko-KR')).toMatch(/2026/)
    expect(formatDueDate('2026-09-08', 'en-US')).toBe('Sep 8, 2026')
  })
  it('marks due urgency without treating completed work as overdue', () => {
    expect(getDueUrgency({ status: 'TODO' }, now)).toBe('none')
    expect(getDueUrgency({ status: 'TODO', dueDate: '2026-09-09' }, now)).toBe(
      'future',
    )
    expect(getDueUrgency({ status: 'TODO', dueDate: '2026-09-08' }, now)).toBe(
      'today',
    )
    expect(getDueUrgency({ status: 'TODO', dueDate: '2026-09-07' }, now)).toBe(
      'overdue',
    )
    expect(getDueUrgency({ status: 'DONE', dueDate: '2026-09-07' }, now)).toBe(
      'completed',
    )
  })
  it('handles stale threshold equality and future timestamps explicitly', () => {
    const updatedAt = new Date(now.getTime() - 3 * 86400000).toISOString()
    expect(isStale({ updatedAt }, 3, now)).toBe(true)
    expect(isStale({ updatedAt }, 3, new Date(now.getTime() - 1))).toBe(false)
    expect(
      isStale({ updatedAt: new Date(now.getTime() + 1).toISOString() }, 0, now),
    ).toBe(false)
    expect(() => isStale({ updatedAt }, -1, now)).toThrow(RangeError)
    expect(() => isStale({ updatedAt }, 0.5, now)).toThrow(RangeError)
  })
  it('rejects invalid dates rather than silently displaying misleading values', () => {
    expect(() => parseLocalDate('2026-02-30')).toThrow(RangeError)
    expect(() => formatExactTime('bad')).toThrow(RangeError)
    expect(() => toLocalDateKey(new Date('bad'))).toThrow(RangeError)
  })
})
