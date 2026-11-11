import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { useRepositoryQuery } from '@/hooks/useRepositoryQuery'
import type { HistaskDatabase } from '@/db/database'
import { createDomainServices } from '@/services'
import type { WorkspaceSnapshot } from '@/services/board-query'
import {
  clearCardFilters,
  hasActiveFilters,
  pruneDeletedClassificationFilters,
} from '@/services/card-filters'
import { buildCardSearchEntries } from '@/services/card-search'
import {
  queryCardProjections,
  queryCardSearchResults,
} from '@/services/card-sort'
import type { DashboardMetrics } from '@/services/dashboard'
import {
  DEFAULT_CARD_FILTER_STATE,
  type CardFilterState,
  type CardSortMode,
} from '@/types/card-query'
import type { CardStatus } from '@/types/domain'
import {
  WorkspaceContext,
  type ClassificationDialogState,
  type WorkspaceContextValue,
} from './workspace-context'

const EMPTY_SNAPSHOT: WorkspaceSnapshot = {
  cards: [],
  workLogsByCard: new Map(),
  categories: [],
  tags: [],
  categoryCardCounts: new Map(),
  tagCardCounts: new Map(),
}

const EMPTY_METRICS: DashboardMetrics = {
  total: 0,
  inProgress: 0,
  waiting: 0,
  done: 0,
  updatedToday: 0,
}

export function WorkspaceProvider({
  database,
  children,
}: {
  database: HistaskDatabase
  children: ReactNode
}) {
  const services = useMemo(() => createDomainServices(database), [database])
  const snapshotQuery = useMemo(
    () => services.board.observeWorkspaceSnapshot(),
    [services],
  )
  const metricsQuery = useMemo(
    () => services.dashboard.observeMetrics(),
    [services],
  )

  const snapshotResult = useRepositoryQuery(snapshotQuery)
  const metricsResult = useRepositoryQuery(metricsQuery)

  const snapshot = snapshotResult.data ?? EMPTY_SNAPSHOT
  const metrics = metricsResult.data ?? EMPTY_METRICS

  const [searchQuery, setSearchQuery] = useState('')
  const [rawFilters, setFilters] = useState<CardFilterState>(
    DEFAULT_CARD_FILTER_STATE,
  )
  const [sortMode, setSortMode] = useState<CardSortMode>('manual')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [quickCreateStatus, setQuickCreateStatus] = useState<CardStatus | null>(
    null,
  )
  const [classificationDialog, setClassificationDialog] =
    useState<ClassificationDialogState>(null)
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [boardError, setBoardError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const cardTriggerRef = useRef<HTMLElement | null>(null)
  const quickCreateTriggerRef = useRef<HTMLElement | null>(null)
  const classificationTriggerRef = useRef<HTMLElement | null>(null)

  const filters = useMemo(() => {
    if (snapshotResult.status !== 'success') return rawFilters
    const categoryIds = new Set(snapshot.categories.map(({ id }) => id))
    const tagIds = new Set(snapshot.tags.map(({ id }) => id))
    return pruneDeletedClassificationFilters(rawFilters, categoryIds, tagIds)
  }, [rawFilters, snapshot.categories, snapshot.tags, snapshotResult.status])

  const updateFilters = useCallback(
    (
      next:
        | CardFilterState
        | ((previous: CardFilterState) => CardFilterState),
    ) => {
      setFilters((previous) => {
        const pruned =
          snapshotResult.status === 'success'
            ? pruneDeletedClassificationFilters(
                previous,
                new Set(snapshot.categories.map(({ id }) => id)),
                new Set(snapshot.tags.map(({ id }) => id)),
              )
            : previous
        return typeof next === 'function' ? next(pruned) : next
      })
    },
    [snapshot.categories, snapshot.tags, snapshotResult.status],
  )

  const restoreFocus = useCallback((ref: RefObject<HTMLElement | null>) => {
    const target = ref.current
    ref.current = null
    requestAnimationFrame(() => {
      if (target && target.isConnected) {
        target.focus()
        return
      }
      const fallback = document.querySelector<HTMLElement>(
        'main button:not([disabled]), main a[href], main input:not([disabled])',
      )
      fallback?.focus()
    })
  }, [])

  const openCard = useCallback(
    (cardId: string, trigger?: HTMLElement | null) => {
      cardTriggerRef.current =
        trigger ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null)
      setSearchDropdownOpen(false)
      setSelectedCardId(cardId)
    },
    [],
  )

  const closeCard = useCallback(() => {
    setSelectedCardId(null)
    restoreFocus(cardTriggerRef)
  }, [restoreFocus])

  const openQuickCreate = useCallback(
    (status: CardStatus = 'TODO', trigger?: HTMLElement | null) => {
      quickCreateTriggerRef.current =
        trigger ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null)
      setQuickCreateStatus(status)
    },
    [],
  )

  const closeQuickCreate = useCallback(() => {
    setQuickCreateStatus(null)
    restoreFocus(quickCreateTriggerRef)
  }, [restoreFocus])

  const openClassificationDialog = useCallback(
    (
      next: NonNullable<ClassificationDialogState>,
      trigger?: HTMLElement | null,
    ) => {
      classificationTriggerRef.current =
        trigger ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null)
      setClassificationDialog(next)
    },
    [],
  )

  const closeClassificationDialog = useCallback(() => {
    setClassificationDialog(null)
    restoreFocus(classificationTriggerRef)
  }, [restoreFocus])

  const clearFiltersAndSearch = useCallback(() => {
    setSearchQuery('')
    setFilters(clearCardFilters())
  }, [])

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [])

  const searchEntries = useMemo(
    () => buildCardSearchEntries(snapshot),
    [snapshot],
  )

  const visibleCards = useMemo(
    () =>
      queryCardProjections(searchEntries, {
        query: searchQuery,
        filters,
        sort: sortMode,
      }),
    [searchEntries, searchQuery, filters, sortMode],
  )

  const searchResults = useMemo(
    () =>
      queryCardSearchResults(searchEntries, {
        query: searchQuery,
        filters,
        sort: 'recentlyUpdated',
      }),
    [searchEntries, searchQuery, filters],
  )

  const selectedCardProjection = useMemo(
    () =>
      selectedCardId === null
        ? undefined
        : snapshot.cards.find(({ card }) => card.id === selectedCardId),
    [snapshot.cards, selectedCardId],
  )

  const effectiveSelectedCardId = selectedCardProjection
    ? selectedCardId
    : null

  const hasAnyFilterOrSearch =
    searchQuery.trim().length > 0 || hasActiveFilters(filters)

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      database,
      services,
      snapshot,
      snapshotStatus: snapshotResult.status,
      snapshotError: snapshotResult.error,
      metrics,
      metricsStatus: metricsResult.status,
      metricsError: metricsResult.error,
      searchQuery,
      setSearchQuery,
      filters,
      setFilters: updateFilters,
      sortMode,
      setSortMode,
      hasAnyFilterOrSearch,
      clearFiltersAndSearch,
      searchEntries,
      visibleCards,
      searchResults,
      selectedCardId: effectiveSelectedCardId,
      selectedCardProjection,
      openCard,
      closeCard,
      quickCreateStatus,
      openQuickCreate,
      closeQuickCreate,
      classificationDialog,
      openClassificationDialog,
      closeClassificationDialog,
      searchInputRef,
      searchDropdownOpen,
      setSearchDropdownOpen,
      focusSearch,
      boardError,
      setBoardError,
    }),
    [
      database,
      services,
      snapshot,
      snapshotResult.status,
      snapshotResult.error,
      metrics,
      metricsResult.status,
      metricsResult.error,
      searchQuery,
      filters,
      updateFilters,
      sortMode,
      hasAnyFilterOrSearch,
      clearFiltersAndSearch,
      searchEntries,
      visibleCards,
      searchResults,
      effectiveSelectedCardId,
      selectedCardProjection,
      openCard,
      closeCard,
      quickCreateStatus,
      openQuickCreate,
      closeQuickCreate,
      classificationDialog,
      openClassificationDialog,
      closeClassificationDialog,
      searchDropdownOpen,
      focusSearch,
      boardError,
    ],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
