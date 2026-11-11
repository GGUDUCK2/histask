import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import type { Card, CardStatus } from '@/types/domain'
import { compareCardsManual } from './board-query'
import { DomainError } from './domain-errors'
import {
  defaultServiceContext,
  timestampNow,
  type ServiceContext,
} from './service-context'
import {
  isCardStatus,
  requireText,
  ValidationError,
} from './validation'

export interface MoveCardInput {
  cardId: string
  targetStatus: CardStatus
  targetIndex?: number
  visibleCardIds?: readonly string[]
}

function normalizeClearedFields(card: Card): Card {
  const normalized = { ...card }
  if (normalized.description === undefined) delete normalized.description
  if (normalized.categoryId === undefined) delete normalized.categoryId
  if (normalized.dueDate === undefined) delete normalized.dueDate
  if (normalized.completedAt === undefined) delete normalized.completedAt
  if (normalized.archivedAt === undefined) delete normalized.archivedAt
  return normalized
}

function validateTargetIndex(targetIndex: number | undefined): void {
  if (targetIndex === undefined) return
  if (!Number.isInteger(targetIndex) || targetIndex < 0) {
    throw new ValidationError(
      'targetIndex',
      'Target position must be a non-negative integer.',
    )
  }
}

function resolveInsertionIndex(
  remaining: readonly Card[],
  targetIndex: number | undefined,
  visibleCardIds: readonly string[] | undefined,
  movedCardId: string,
): number {
  if (targetIndex === undefined) return remaining.length
  if (visibleCardIds === undefined) {
    return Math.max(0, Math.min(targetIndex, remaining.length))
  }

  const visibleSet = new Set(visibleCardIds.filter((id) => id !== movedCardId))
  const visibleIndices: number[] = []
  for (let index = 0; index < remaining.length; index += 1) {
    if (visibleSet.has(remaining[index].id)) {
      visibleIndices.push(index)
    }
  }

  if (visibleIndices.length === 0) return remaining.length

  const clamped = Math.max(0, Math.min(targetIndex, visibleIndices.length))
  if (clamped < visibleIndices.length) {
    return visibleIndices[clamped]
  }
  return visibleIndices[visibleIndices.length - 1] + 1
}

export class CardOrderService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner
  private readonly context: ServiceContext

  constructor(
    database: HistaskDatabase,
    context: ServiceContext = defaultServiceContext,
  ) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
    this.context = context
  }

  async moveCard(input: MoveCardInput): Promise<Card[]> {
    const cardId = requireText(input.cardId, 'cardId')
    if (!isCardStatus(input.targetStatus)) {
      throw new ValidationError('targetStatus', 'Choose a valid status.')
    }
    validateTargetIndex(input.targetIndex)

    return this.transactions.write(['cards'], () =>
      this.applyMoveCard({
        cardId,
        targetStatus: input.targetStatus,
        targetIndex: input.targetIndex,
        visibleCardIds: input.visibleCardIds,
      }),
    )
  }

  async moveCardStep(
    cardId: string,
    direction: 'up' | 'down',
    visibleCardIds?: readonly string[],
  ): Promise<Card[]> {
    const id = requireText(cardId, 'cardId')
    return this.transactions.write(['cards'], async () => {
      const card = await this.database.cards.get(id)
      if (!card) throw new DomainError('NOT_FOUND', 'Card', id)
      if (card.archivedAt !== undefined) {
        throw new ValidationError('card', 'Archived cards cannot be reordered.')
      }

      const columnCards = (
        await this.database.cards.where('status').equals(card.status).toArray()
      )
        .filter(({ archivedAt }) => archivedAt === undefined)
        .sort(compareCardsManual)

      const visibleList =
        visibleCardIds === undefined
          ? columnCards.map(({ id: itemId }) => itemId)
          : columnCards
              .map(({ id: itemId }) => itemId)
              .filter((itemId) => visibleCardIds.includes(itemId))

      const currentVisibleIndex = visibleList.indexOf(id)
      if (currentVisibleIndex === -1) return columnCards

      const remainingVisible = visibleList.filter((itemId) => itemId !== id)
      const targetVisibleIndex =
        direction === 'up'
          ? Math.max(0, currentVisibleIndex - 1)
          : Math.min(remainingVisible.length, currentVisibleIndex + 1)

      return this.applyMoveCard({
        cardId: id,
        targetStatus: card.status,
        targetIndex: targetVisibleIndex,
        visibleCardIds: visibleList,
      })
    })
  }

  private async applyMoveCard(input: MoveCardInput): Promise<Card[]> {
    const { cardId } = input
    const movedCard = await this.database.cards.get(cardId)
    if (!movedCard) throw new DomainError('NOT_FOUND', 'Card', cardId)
    if (movedCard.archivedAt !== undefined) {
      throw new ValidationError('card', 'Archived cards cannot be reordered.')
    }

    const allCards = await this.database.cards.toArray()
    const activeCards = allCards.filter(
      ({ archivedAt }) => archivedAt === undefined,
    )
    const sourceStatus = movedCard.status
    const statusChanged = sourceStatus !== input.targetStatus
    const timestamp = statusChanged ? timestampNow(this.context) : undefined

    let nextCompletedAt = movedCard.completedAt
    if (statusChanged) {
      nextCompletedAt = input.targetStatus === 'DONE' ? timestamp : undefined
    }

    const movedNextBase: Card = normalizeClearedFields({
      ...movedCard,
      status: input.targetStatus,
      completedAt: nextCompletedAt,
      updatedAt: timestamp ?? movedCard.updatedAt,
    })

    const targetRemaining = activeCards
      .filter(
        (card) => card.status === input.targetStatus && card.id !== cardId,
      )
      .sort(compareCardsManual)

    const insertAt = resolveInsertionIndex(
      targetRemaining,
      input.targetIndex,
      input.visibleCardIds,
      cardId,
    )

    const nextTargetList = [
      ...targetRemaining.slice(0, insertAt),
      movedNextBase,
      ...targetRemaining.slice(insertAt),
    ]

    const changed: Card[] = []
    const normalizedTargetList = nextTargetList.map((card, index) => {
      const updated =
        card.sortOrder === index ? card : { ...card, sortOrder: index }
      if (card.id === cardId) {
        if (
          statusChanged ||
          card.sortOrder !== index ||
          updated.completedAt !== movedCard.completedAt
        ) {
          changed.push(updated)
        }
      } else if (card.sortOrder !== index) {
        changed.push(updated)
      }
      return updated
    })

    if (statusChanged) {
      const sourceRemaining = activeCards
        .filter((card) => card.status === sourceStatus && card.id !== cardId)
        .sort(compareCardsManual)
      sourceRemaining.forEach((card, index) => {
        if (card.sortOrder !== index) {
          changed.push({ ...card, sortOrder: index })
        }
      })
    }

    if (changed.length > 0) {
      await this.database.cards.bulkPut(changed)
    }

    return normalizedTargetList
  }
}
