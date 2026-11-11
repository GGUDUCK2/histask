import type { CardFilterState } from '@/types/card-query'
import { DEFAULT_CARD_FILTER_STATE } from '@/types/card-query'
import { toLocalDateKey } from '@/utils/dates'
import type { BoardCardProjection } from './board-query'

export function hasActiveFilters(filters: CardFilterState): boolean {
  return (
    filters.categoryId !== null ||
    filters.tagId !== null ||
    filters.status !== null ||
    filters.priority !== null ||
    filters.due !== 'all'
  )
}

export function matchesDueDateFilter(
  card: BoardCardProjection['card'],
  dueFilter: CardFilterState['due'],
  todayKey: string,
): boolean {
  switch (dueFilter) {
    case 'all':
      return true
    case 'noDue':
      return card.dueDate === undefined
    case 'overdue':
      return (
        card.dueDate !== undefined &&
        card.status !== 'DONE' &&
        card.dueDate < todayKey
      )
    case 'today':
      return card.dueDate === todayKey
    case 'upcoming':
      return card.dueDate !== undefined && card.dueDate > todayKey
  }
}

export function matchesCardFilters(
  projection: BoardCardProjection,
  filters: CardFilterState,
  now: Date = new Date(),
): boolean {
  const { card, tags } = projection
  if (card.archivedAt !== undefined) return false

  if (
    filters.categoryId !== null &&
    card.categoryId !== filters.categoryId
  ) {
    return false
  }
  if (
    filters.tagId !== null &&
    !tags.some((tag) => tag.id === filters.tagId)
  ) {
    return false
  }
  if (filters.status !== null && card.status !== filters.status) {
    return false
  }
  if (filters.priority !== null && card.priority !== filters.priority) {
    return false
  }
  if (filters.due !== 'all') {
    const todayKey = toLocalDateKey(now)
    if (!matchesDueDateFilter(card, filters.due, todayKey)) {
      return false
    }
  }
  return true
}

export function filterCardProjections(
  projections: readonly BoardCardProjection[],
  filters: CardFilterState,
  now: Date = new Date(),
): BoardCardProjection[] {
  if (!hasActiveFilters(filters)) {
    return projections.filter(({ card }) => card.archivedAt === undefined)
  }
  const todayKey = toLocalDateKey(now)
  return projections.filter((projection) => {
    const { card, tags } = projection
    if (card.archivedAt !== undefined) return false
    if (
      filters.categoryId !== null &&
      card.categoryId !== filters.categoryId
    ) {
      return false
    }
    if (
      filters.tagId !== null &&
      !tags.some((tag) => tag.id === filters.tagId)
    ) {
      return false
    }
    if (filters.status !== null && card.status !== filters.status) {
      return false
    }
    if (filters.priority !== null && card.priority !== filters.priority) {
      return false
    }
    if (
      filters.due !== 'all' &&
      !matchesDueDateFilter(card, filters.due, todayKey)
    ) {
      return false
    }
    return true
  })
}

export function pruneDeletedClassificationFilters(
  filters: CardFilterState,
  categoryIds: ReadonlySet<string>,
  tagIds: ReadonlySet<string>,
): CardFilterState {
  const nextCategoryId =
    filters.categoryId !== null && !categoryIds.has(filters.categoryId)
      ? null
      : filters.categoryId
  const nextTagId =
    filters.tagId !== null && !tagIds.has(filters.tagId) ? null : filters.tagId
  if (
    nextCategoryId === filters.categoryId &&
    nextTagId === filters.tagId
  ) {
    return filters
  }
  return {
    ...filters,
    categoryId: nextCategoryId,
    tagId: nextTagId,
  }
}

export function clearCardFilters(): CardFilterState {
  return { ...DEFAULT_CARD_FILTER_STATE }
}
