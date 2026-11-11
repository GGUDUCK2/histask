import { useCallback, useMemo, useRef, useState } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { HistaskDomainServices } from '@/services'
import type { BoardCardProjection } from '@/services/board-query'
import type { MoveCardInput } from '@/services/card-order'
import {
  CARD_SORT_LABELS,
  type CardSortMode,
} from '@/types/card-query'
import { CARD_STATUSES, type CardStatus } from '@/types/domain'

const COLUMN_PREFIX = 'column:'

export function columnDroppableId(status: CardStatus): string {
  return `${COLUMN_PREFIX}${status}`
}

export function parseColumnDroppableId(id: string): CardStatus | null {
  if (!id.startsWith(COLUMN_PREFIX)) return null
  const candidate = id.slice(COLUMN_PREFIX.length)
  return CARD_STATUSES.find((status) => status === candidate) ?? null
}

type ColumnMap = Record<CardStatus, BoardCardProjection[]>

function cloneColumns(columns: ColumnMap): ColumnMap {
  return {
    TODO: [...columns.TODO],
    IN_PROGRESS: [...columns.IN_PROGRESS],
    WAITING: [...columns.WAITING],
    DONE: [...columns.DONE],
  }
}

function findColumnForId(
  columns: ColumnMap,
  id: string,
): CardStatus | null {
  const directColumn = parseColumnDroppableId(id)
  if (directColumn) return directColumn
  for (const status of CARD_STATUSES) {
    if (columns[status].some(({ card }) => card.id === id)) {
      return status
    }
  }
  return null
}

export function useBoardDnd({
  cardsByStatus,
  sortMode,
  services,
  onError,
}: {
  cardsByStatus: ColumnMap
  sortMode: CardSortMode
  services: HistaskDomainServices
  onError: (message: string | null) => void
}) {
  const [optimisticColumns, setOptimisticColumns] = useState<ColumnMap | null>(
    null,
  )
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [dndNotice, setDndNotice] = useState<string | null>(null)
  const [failedMoveInput, setFailedMoveInput] = useState<MoveCardInput | null>(
    null,
  )

  const snapshotRef = useRef<ColumnMap | null>(null)
  const optimisticRef = useRef<ColumnMap | null>(null)

  const setOptimistic = useCallback((next: ColumnMap | null) => {
    optimisticRef.current = next
    setOptimisticColumns(next)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const displayedColumns = optimisticColumns ?? cardsByStatus

  const activeProjection = useMemo(() => {
    if (!activeCardId) return undefined
    for (const status of CARD_STATUSES) {
      const found = displayedColumns[status].find(
        ({ card }) => card.id === activeCardId,
      )
      if (found) return found
    }
    return undefined
  }, [activeCardId, displayedColumns])

  const persistMove = useCallback(
    async (input: MoveCardInput) => {
      onError(null)
      setFailedMoveInput(null)
      try {
        await services.cardOrder.moveCard(input)
        setOptimistic(null)
      } catch {
        setOptimistic(null)
        setFailedMoveInput(input)
        onError(
          'Could not save the new task order or status locally. Your previous board order was restored.',
        )
      }
    },
    [onError, services.cardOrder, setOptimistic],
  )

  const retryFailedMove = useCallback(() => {
    if (!failedMoveInput) return
    void persistMove(failedMoveInput)
  }, [failedMoveInput, persistMove])

  const dismissError = useCallback(() => {
    onError(null)
    setFailedMoveInput(null)
  }, [onError])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveCardId(String(event.active.id))
      setDndNotice(null)
      onError(null)
      setFailedMoveInput(null)
      snapshotRef.current = cloneColumns(cardsByStatus)
      setOptimistic(null)
    },
    [cardsByStatus, onError, setOptimistic],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)
      const current = optimisticRef.current ?? snapshotRef.current ?? cardsByStatus
      const activeStatus = findColumnForId(current, activeId)
      const overStatus = findColumnForId(current, overId)
      if (!activeStatus || !overStatus) return

      if (activeStatus === overStatus) {
        if (sortMode !== 'manual' && activeId !== overId) {
          setDndNotice(
            `Manual within-column reordering is disabled while sorted by ${CARD_SORT_LABELS[sortMode]}. Drag to another column to change status, or switch sort to Manual.`,
          )
        }
        return
      }

      setDndNotice(null)
      const next = cloneColumns(current)
      const sourceItems = next[activeStatus]
      const targetItems = next[overStatus]
      const activeIndex = sourceItems.findIndex(
        ({ card }) => card.id === activeId,
      )
      if (activeIndex === -1) return

      const [moving] = sourceItems.splice(activeIndex, 1)
      const updatedMoving: BoardCardProjection = {
        ...moving,
        card: { ...moving.card, status: overStatus },
      }

      const overColumnDrop = parseColumnDroppableId(overId) !== null
      const overIndex = overColumnDrop
        ? targetItems.length
        : targetItems.findIndex(({ card }) => card.id === overId)
      const insertAt = overIndex === -1 ? targetItems.length : overIndex
      targetItems.splice(insertAt, 0, updatedMoving)

      setOptimistic(next)
    },
    [cardsByStatus, setOptimistic, sortMode],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const base = snapshotRef.current ?? cardsByStatus
      const current = optimisticRef.current ?? base

      setActiveCardId(null)
      snapshotRef.current = null

      if (!over) {
        setOptimistic(null)
        return
      }

      const activeId = String(active.id)
      const overId = String(over.id)
      const sourceStatus = findColumnForId(base, activeId)
      const previewStatus = findColumnForId(current, activeId)
      const overStatus = findColumnForId(current, overId)
      const targetStatus =
        previewStatus && previewStatus !== sourceStatus
          ? previewStatus
          : (overStatus ?? previewStatus)

      if (!sourceStatus || !targetStatus) {
        setOptimistic(null)
        return
      }

      if (sourceStatus === targetStatus) {
        const list = base[sourceStatus]
        const oldIndex = list.findIndex(({ card }) => card.id === activeId)
        const newIndex =
          parseColumnDroppableId(overId) !== null
            ? list.length - 1
            : list.findIndex(({ card }) => card.id === overId)

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          setOptimistic(null)
          return
        }

        if (sortMode !== 'manual') {
          setOptimistic(null)
          setDndNotice(
            `Manual within-column reordering is disabled while sorted by ${CARD_SORT_LABELS[sortMode]}. Switch sort to Manual to drag cards inside a column.`,
          )
          return
        }

        const next = cloneColumns(base)
        next[sourceStatus] = arrayMove(list, oldIndex, newIndex)
        setOptimistic(next)

        void persistMove({
          cardId: activeId,
          targetStatus: sourceStatus,
          targetIndex: newIndex,
          visibleCardIds: list.map(({ card }) => card.id),
        })
        return
      }

      // Cross-column status change (works across all sort modes).
      const targetPreviewList = current[targetStatus]
      const targetBaseList = base[targetStatus]
      const previewIndex = targetPreviewList.findIndex(
        ({ card }) => card.id === activeId,
      )
      const targetIndex =
        sortMode === 'manual'
          ? previewIndex >= 0
            ? previewIndex
            : targetBaseList.length
          : undefined

      void persistMove({
        cardId: activeId,
        targetStatus,
        ...(targetIndex === undefined ? {} : { targetIndex }),
        visibleCardIds: targetBaseList.map(({ card }) => card.id),
      })
    },
    [cardsByStatus, persistMove, setOptimistic, sortMode],
  )

  const handleDragCancel = useCallback(() => {
    setActiveCardId(null)
    snapshotRef.current = null
    setOptimistic(null)
  }, [setOptimistic])

  const handleMoveStep = useCallback(
    async (cardId: string, direction: 'up' | 'down') => {
      const sourceStatus = findColumnForId(cardsByStatus, cardId)
      if (!sourceStatus) return
      const visibleIds = cardsByStatus[sourceStatus].map(({ card }) => card.id)
      onError(null)
      setFailedMoveInput(null)
      try {
        await services.cardOrder.moveCardStep(cardId, direction, visibleIds)
      } catch {
        onError('Could not save the new task order locally.')
      }
    },
    [cardsByStatus, onError, services.cardOrder],
  )

  const handleMoveStatus = useCallback(
    (cardId: string, targetStatus: CardStatus) => {
      void persistMove({
        cardId,
        targetStatus,
        visibleCardIds: cardsByStatus[targetStatus].map(({ card }) => card.id),
      })
    },
    [cardsByStatus, persistMove],
  )

  return {
    sensors,
    displayedColumns,
    activeProjection,
    dndNotice,
    setDndNotice,
    hasRetryableMove: failedMoveInput !== null,
    retryFailedMove,
    dismissError,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleMoveStep,
    handleMoveStatus,
  }
}
