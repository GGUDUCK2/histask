import type { HistaskDatabase } from '@/db/database'
import {
  createRepositoryQuery,
  type RepositoryQuery,
} from '@/repositories/query'
import type { WorkLog } from '@/types/domain'
import { isOnLocalDay, parseLocalDate, toLocalDateKey } from '@/utils/dates'
import {
  BoardQueryService,
  compareCardsManual,
  type BoardCardProjection,
  type WorkspaceSnapshot,
} from './board-query'

export interface DateActivityIndicator {
  dateKey: string
  hasDue: boolean
  hasCompleted: boolean
  hasWorkLog: boolean
}

export interface DateWorkUpdatedItem {
  projection: BoardCardProjection
  dayWorkLogs: readonly WorkLog[]
  latestDayWorkLog: WorkLog
}

export interface DateWorkSummary {
  dateKey: string
  due: BoardCardProjection[]
  updated: DateWorkUpdatedItem[]
  completed: BoardCardProjection[]
  created: BoardCardProjection[]
}

function monthKeyPrefix(year: number, monthIndex: number): string {
  return `${String(year).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}-`
}

function upsertIndicator(
  map: Map<string, DateActivityIndicator>,
  dateKey: string,
  flag: 'hasDue' | 'hasCompleted' | 'hasWorkLog',
): void {
  const existing = map.get(dateKey) ?? {
    dateKey,
    hasDue: false,
    hasCompleted: false,
    hasWorkLog: false,
  }
  existing[flag] = true
  map.set(dateKey, existing)
}

export function computeMonthActivityIndicators(
  snapshot: Pick<WorkspaceSnapshot, 'cards' | 'workLogsByCard'>,
  year: number,
  monthIndex: number,
): ReadonlyMap<string, DateActivityIndicator> {
  const prefix = monthKeyPrefix(year, monthIndex)
  const indicators = new Map<string, DateActivityIndicator>()

  for (const { card } of snapshot.cards) {
    if (card.archivedAt !== undefined) continue

    if (card.dueDate && card.dueDate.startsWith(prefix)) {
      upsertIndicator(indicators, card.dueDate, 'hasDue')
    }

    if (card.status === 'DONE' && card.completedAt) {
      const completedKey = toLocalDateKey(new Date(card.completedAt))
      if (completedKey.startsWith(prefix)) {
        upsertIndicator(indicators, completedKey, 'hasCompleted')
      }
    }

    const logs = snapshot.workLogsByCard.get(card.id) ?? []
    for (const log of logs) {
      const logKey = toLocalDateKey(new Date(log.createdAt))
      if (logKey.startsWith(prefix)) {
        upsertIndicator(indicators, logKey, 'hasWorkLog')
      }
    }
  }

  return indicators
}

export function computeDateWorkSummary(
  snapshot: Pick<WorkspaceSnapshot, 'cards' | 'workLogsByCard'>,
  dateOrKey: Date | string,
): DateWorkSummary {
  const targetDay =
    typeof dateOrKey === 'string' ? parseLocalDate(dateOrKey) : dateOrKey
  const dateKey = toLocalDateKey(targetDay)

  const due: BoardCardProjection[] = []
  const updated: DateWorkUpdatedItem[] = []
  const completed: BoardCardProjection[] = []
  const created: BoardCardProjection[] = []

  for (const projection of snapshot.cards) {
    const { card } = projection
    if (card.archivedAt !== undefined) continue

    if (card.dueDate === dateKey) {
      due.push(projection)
    }

    const logs = snapshot.workLogsByCard.get(card.id) ?? []
    const dayWorkLogs = logs.filter((log) =>
      isOnLocalDay(log.createdAt, targetDay),
    )
    if (dayWorkLogs.length > 0) {
      updated.push({
        projection,
        dayWorkLogs,
        latestDayWorkLog: dayWorkLogs[0],
      })
    }

    if (
      card.status === 'DONE' &&
      card.completedAt !== undefined &&
      isOnLocalDay(card.completedAt, targetDay)
    ) {
      completed.push(projection)
    }

    if (isOnLocalDay(card.createdAt, targetDay)) {
      created.push(projection)
    }
  }

  due.sort((left, right) => {
    const leftDone = left.card.status === 'DONE' ? 1 : 0
    const rightDone = right.card.status === 'DONE' ? 1 : 0
    return leftDone - rightDone || compareCardsManual(left.card, right.card)
  })

  updated.sort(
    (left, right) =>
      right.latestDayWorkLog.createdAt.localeCompare(
        left.latestDayWorkLog.createdAt,
      ) || left.projection.card.id.localeCompare(right.projection.card.id),
  )

  completed.sort(
    (left, right) =>
      (right.card.completedAt ?? '').localeCompare(
        left.card.completedAt ?? '',
      ) || left.card.id.localeCompare(right.card.id),
  )

  created.sort(
    (left, right) =>
      right.card.createdAt.localeCompare(left.card.createdAt) ||
      left.card.id.localeCompare(right.card.id),
  )

  return {
    dateKey,
    due,
    updated,
    completed,
    created,
  }
}

export class DateWorkService {
  private readonly boardQuery: BoardQueryService

  constructor(database: HistaskDatabase) {
    this.boardQuery = new BoardQueryService(database)
  }

  async getMonthIndicators(
    year: number,
    monthIndex: number,
  ): Promise<ReadonlyMap<string, DateActivityIndicator>> {
    const snapshot = await this.boardQuery.getWorkspaceSnapshot()
    return computeMonthActivityIndicators(snapshot, year, monthIndex)
  }

  async getDateWork(dateOrKey: Date | string): Promise<DateWorkSummary> {
    const snapshot = await this.boardQuery.getWorkspaceSnapshot()
    return computeDateWorkSummary(snapshot, dateOrKey)
  }

  observeDateWork(dateOrKey: Date | string): RepositoryQuery<DateWorkSummary> {
    return createRepositoryQuery('observe date work summary', () =>
      this.getDateWork(dateOrKey),
    )
  }
}
