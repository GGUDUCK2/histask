import type { HistaskDatabase } from '@/db/database'
import {
  createRepositoryQuery,
  type RepositoryQuery,
} from '@/repositories/query'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import { toDataError } from './data-errors'
import { localDayRange } from '@/utils/dates'

export interface DashboardMetrics {
  total: number
  inProgress: number
  waiting: number
  done: number
  updatedToday: number
}

interface DashboardScheduler {
  set(callback: () => void, delay: number): ReturnType<typeof setTimeout>
  clear(handle: ReturnType<typeof setTimeout>): void
}

interface VisibilitySource {
  readonly visibilityState: string
  addEventListener(type: 'visibilitychange', listener: EventListener): void
  removeEventListener(type: 'visibilitychange', listener: EventListener): void
}

export interface DashboardObservationOptions {
  clock?: () => Date
  scheduler?: DashboardScheduler
  visibilitySource?: VisibilitySource
}

const defaultScheduler: DashboardScheduler = {
  set: (callback, delay) => setTimeout(callback, delay),
  clear: (handle) => clearTimeout(handle),
}

function defaultVisibilitySource(): VisibilitySource | undefined {
  return typeof document === 'undefined' ? undefined : document
}

export function millisecondsUntilNextLocalDay(now: Date): number {
  if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid date')
  const nextDay = new Date(now)
  nextDay.setHours(24, 0, 0, 0)
  return Math.max(1, nextDay.getTime() - now.getTime())
}

export class DashboardService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner
  private readonly clock: () => Date
  private readonly scheduler: DashboardScheduler
  private readonly visibilitySource: VisibilitySource | undefined

  constructor(
    database: HistaskDatabase,
    options: DashboardObservationOptions = {},
  ) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
    this.clock = options.clock ?? (() => new Date())
    this.scheduler = options.scheduler ?? defaultScheduler
    this.visibilitySource =
      options.visibilitySource ?? defaultVisibilitySource()
  }

  getMetrics(day: Date = this.clock()): Promise<DashboardMetrics> {
    const { start, end } = localDayRange(day)
    return this.transactions.read(['cards', 'workLogs'], async () => {
      const [allCards, todayLogs] = await Promise.all([
        this.database.cards.toArray(),
        this.database.workLogs
          .where('createdAt')
          .between(start, end, true, false)
          .toArray(),
      ])
      const cards = allCards.filter(
        ({ archivedAt }) => archivedAt === undefined,
      )
      const visibleCardIds = new Set(cards.map(({ id }) => id))
      const updatedCardIds = new Set(
        todayLogs
          .filter(({ cardId }) => visibleCardIds.has(cardId))
          .map(({ cardId }) => cardId),
      )
      return {
        total: cards.length,
        inProgress: cards.filter(({ status }) => status === 'IN_PROGRESS')
          .length,
        waiting: cards.filter(({ status }) => status === 'WAITING').length,
        done: cards.filter(({ status }) => status === 'DONE').length,
        updatedToday: updatedCardIds.size,
      }
    })
  }

  observeMetrics(): RepositoryQuery<DashboardMetrics> {
    return {
      subscribe: (onValue, onError) => {
        let active = true
        let dayTimer: ReturnType<typeof setTimeout> | undefined
        const databaseQuery = createRepositoryQuery(
          'observe dashboard metrics',
          () => this.getMetrics(this.clock()),
        )
        const unsubscribeDatabase = databaseQuery.subscribe(onValue, onError)

        const refresh = async () => {
          try {
            const metrics = await this.getMetrics(this.clock())
            if (active) onValue(metrics)
          } catch (error) {
            if (active)
              onError(
                toDataError(error, 'READ_FAILED', 'refresh dashboard metrics'),
              )
          }
        }
        const scheduleNextDay = () => {
          if (dayTimer !== undefined) this.scheduler.clear(dayTimer)
          dayTimer = this.scheduler.set(() => {
            void refresh().finally(() => {
              if (active) scheduleNextDay()
            })
          }, millisecondsUntilNextLocalDay(this.clock()))
        }
        const handleVisibilityChange: EventListener = () => {
          if (this.visibilitySource?.visibilityState === 'hidden') return
          void refresh()
          scheduleNextDay()
        }

        scheduleNextDay()
        this.visibilitySource?.addEventListener(
          'visibilitychange',
          handleVisibilityChange,
        )

        return () => {
          active = false
          unsubscribeDatabase()
          if (dayTimer !== undefined) this.scheduler.clear(dayTimer)
          this.visibilitySource?.removeEventListener(
            'visibilitychange',
            handleVisibilityChange,
          )
        }
      },
    }
  }
}
