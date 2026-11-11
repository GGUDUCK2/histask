import { createContext, useContext, type RefObject } from 'react'
import type { HistaskDatabase } from '@/db/database'
import type { HistaskDomainServices } from '@/services'
import type {
  BoardCardProjection,
  WorkspaceSnapshot,
} from '@/services/board-query'
import type { DashboardMetrics } from '@/services/dashboard'
import type {
  CardFilterState,
  CardSearchEntry,
  CardSearchResult,
  CardSortMode,
} from '@/types/card-query'
import type { CardStatus } from '@/types/domain'

export type ClassificationDialogState =
  | { kind: 'category'; mode: 'create' | 'edit'; itemId?: string }
  | { kind: 'tag'; mode: 'create' | 'edit'; itemId?: string }
  | null

export interface WorkspaceContextValue {
  database: HistaskDatabase
  services: HistaskDomainServices
  snapshot: WorkspaceSnapshot
  snapshotStatus: 'loading' | 'success' | 'error'
  snapshotError?: unknown
  metrics: DashboardMetrics
  metricsStatus: 'loading' | 'success' | 'error'
  metricsError?: unknown
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: CardFilterState
  setFilters: (
    next:
      | CardFilterState
      | ((previous: CardFilterState) => CardFilterState),
  ) => void
  sortMode: CardSortMode
  setSortMode: (sortMode: CardSortMode) => void
  hasAnyFilterOrSearch: boolean
  clearFiltersAndSearch: () => void
  searchEntries: CardSearchEntry[]
  visibleCards: BoardCardProjection[]
  searchResults: CardSearchResult[]
  selectedCardId: string | null
  selectedCardProjection?: BoardCardProjection
  openCard: (cardId: string, trigger?: HTMLElement | null) => void
  closeCard: () => void
  quickCreateStatus: CardStatus | null
  openQuickCreate: (status?: CardStatus, trigger?: HTMLElement | null) => void
  closeQuickCreate: () => void
  classificationDialog: ClassificationDialogState
  openClassificationDialog: (
    next: NonNullable<ClassificationDialogState>,
    trigger?: HTMLElement | null,
  ) => void
  closeClassificationDialog: () => void
  searchInputRef: RefObject<HTMLInputElement | null>
  searchDropdownOpen: boolean
  setSearchDropdownOpen: (open: boolean) => void
  focusSearch: () => void
  boardError: string | null
  setBoardError: (message: string | null) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
)

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider.')
  }
  return context
}
