import type { CardStatus, Priority, WorkLog } from './domain'
import type { BoardCardProjection } from '@/services/board-query'

export type DueDateFilter =
  | 'all'
  | 'overdue'
  | 'today'
  | 'upcoming'
  | 'noDue'

export type CardSortMode =
  | 'manual'
  | 'recentlyUpdated'
  | 'createdDate'
  | 'dueDate'
  | 'priority'

export const CARD_SORT_MODES: readonly CardSortMode[] = [
  'manual',
  'recentlyUpdated',
  'createdDate',
  'dueDate',
  'priority',
]

export const CARD_SORT_LABELS: Record<CardSortMode, string> = {
  manual: 'Manual',
  recentlyUpdated: 'Recently updated',
  createdDate: 'Created date',
  dueDate: 'Due date',
  priority: 'Priority',
}

export const DUE_DATE_FILTER_LABELS: Record<DueDateFilter, string> = {
  all: 'Any due date',
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Upcoming',
  noDue: 'No due date',
}

export interface CardFilterState {
  categoryId: string | null
  tagId: string | null
  status: CardStatus | null
  priority: Priority | null
  due: DueDateFilter
}

export const DEFAULT_CARD_FILTER_STATE: CardFilterState = {
  categoryId: null,
  tagId: null,
  status: null,
  priority: null,
  due: 'all',
}

export type SearchMatchSource =
  | 'title'
  | 'description'
  | 'category'
  | 'tag'
  | 'workLog'

export const SEARCH_SOURCE_LABELS: Record<SearchMatchSource, string> = {
  title: 'Title',
  description: 'Description',
  category: 'Category',
  tag: 'Tag',
  workLog: 'WorkLog',
}

export interface SearchMatchExcerpt {
  source: SearchMatchSource
  text: string
  matchStart: number
  matchLength: number
  workLogCreatedAt?: string
}

export interface CardSearchEntry {
  projection: BoardCardProjection
  workLogs: readonly WorkLog[]
}

export interface CardSearchResult {
  projection: BoardCardProjection
  matchedSources: SearchMatchSource[]
  excerpt: SearchMatchExcerpt
}
