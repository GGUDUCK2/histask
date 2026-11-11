import type {
  CardFilterState,
  CardSearchEntry,
  CardSearchResult,
  CardSortMode,
} from '@/types/card-query'
import type { Priority } from '@/types/domain'
import { compareCardsManual, type BoardCardProjection } from './board-query'
import { filterCardProjections, matchesCardFilters } from './card-filters'
import { matchCardSearch, normalizeSearchQuery } from './card-search'

const PRIORITY_RANK: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  NONE: 3,
}

export function compareCardProjections(
  left: BoardCardProjection,
  right: BoardCardProjection,
  sortMode: CardSortMode,
): number {
  const a = left.card
  const b = right.card

  switch (sortMode) {
    case 'manual':
      return compareCardsManual(a, b)
    case 'recentlyUpdated':
      return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)
    case 'createdDate':
      return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)
    case 'dueDate': {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return a.id.localeCompare(b.id)
    }
    case 'priority': {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      return rankDiff || a.id.localeCompare(b.id)
    }
  }
}

export function sortCardProjections(
  projections: readonly BoardCardProjection[],
  sortMode: CardSortMode,
): BoardCardProjection[] {
  return [...projections].sort((left, right) =>
    compareCardProjections(left, right, sortMode),
  )
}

export interface CardQueryOptions {
  query: string
  filters: CardFilterState
  sort: CardSortMode
  now?: Date
}

export function queryCardProjections(
  entries: readonly CardSearchEntry[],
  options: CardQueryOptions,
): BoardCardProjection[] {
  const now = options.now ?? new Date()
  const normalizedQuery = normalizeSearchQuery(options.query)
  const matching: BoardCardProjection[] = []

  if (!normalizedQuery) {
    const projections = entries.map(({ projection }) => projection)
    return sortCardProjections(
      filterCardProjections(projections, options.filters, now),
      options.sort,
    )
  }

  for (const entry of entries) {
    if (!matchesCardFilters(entry.projection, options.filters, now)) continue
    if (matchCardSearch(entry, normalizedQuery)) {
      matching.push(entry.projection)
    }
  }
  return sortCardProjections(matching, options.sort)
}

export function queryCardSearchResults(
  entries: readonly CardSearchEntry[],
  options: Omit<CardQueryOptions, 'sort'> & { sort?: CardSortMode },
): CardSearchResult[] {
  const normalizedQuery = normalizeSearchQuery(options.query)
  if (!normalizedQuery) return []
  const now = options.now ?? new Date()
  const sortMode = options.sort ?? 'recentlyUpdated'

  const matched: CardSearchResult[] = []
  for (const entry of entries) {
    if (!matchesCardFilters(entry.projection, options.filters, now)) continue
    const result = matchCardSearch(entry, normalizedQuery)
    if (result) matched.push(result)
  }

  return matched.sort((left, right) =>
    compareCardProjections(left.projection, right.projection, sortMode),
  )
}
