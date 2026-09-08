import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import {
  type Card,
  type CardInput,
  type CardStatus,
  type Priority,
} from '@/types/domain'
import { isDateOnly } from '@/utils/dates'
import { DomainError } from './domain-errors'
import {
  defaultServiceContext,
  timestampNow,
  type ServiceContext,
} from './service-context'
import {
  isCardStatus,
  isPriority,
  isRecord,
  parseCardInput,
  requireSortOrder,
  requireText,
  ValidationError,
} from './validation'

export interface UpdateCardInput {
  title?: string
  description?: string | null
  status?: CardStatus
  categoryId?: string | null
  priority?: Priority
  dueDate?: string | null
  sortOrder?: number
  tagIds?: string[]
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function parseTagIds(value: unknown): string[] {
  if (!Array.isArray(value))
    throw new ValidationError('tagIds', 'Tags must be a list.')
  const ids = value.map((id) => requireText(id, 'tagId'))
  return [...new Set(ids)]
}

function parseCardUpdate(value: unknown): UpdateCardInput {
  if (!isRecord(value))
    throw new ValidationError('card', 'Card changes must be an object.')
  const patch: UpdateCardInput = {}

  if (hasOwn(value, 'title')) patch.title = requireText(value.title, 'title')
  if (hasOwn(value, 'description')) {
    if (value.description !== null && typeof value.description !== 'string')
      throw new ValidationError('description', 'Description must be text.')
    patch.description = value.description
  }
  if (hasOwn(value, 'status')) {
    if (!isCardStatus(value.status))
      throw new ValidationError('status', 'Choose a valid status.')
    patch.status = value.status
  }
  if (hasOwn(value, 'categoryId')) {
    patch.categoryId =
      value.categoryId === null
        ? null
        : requireText(value.categoryId, 'categoryId')
  }
  if (hasOwn(value, 'priority')) {
    if (!isPriority(value.priority))
      throw new ValidationError('priority', 'Choose a valid priority.')
    patch.priority = value.priority
  }
  if (hasOwn(value, 'dueDate')) {
    if (value.dueDate !== null && !isDateOnly(value.dueDate))
      throw new ValidationError('dueDate', 'Choose a valid calendar date.')
    patch.dueDate = value.dueDate
  }
  if (hasOwn(value, 'sortOrder'))
    patch.sortOrder = requireSortOrder(value.sortOrder)
  if (hasOwn(value, 'tagIds')) patch.tagIds = parseTagIds(value.tagIds)

  if (Object.keys(patch).length === 0)
    throw new ValidationError('card', 'Provide at least one card change.')
  return patch
}

function withoutClearedFields(card: Card): Card {
  const normalized = { ...card }
  if (normalized.description === undefined) delete normalized.description
  if (normalized.categoryId === undefined) delete normalized.categoryId
  if (normalized.dueDate === undefined) delete normalized.dueDate
  if (normalized.completedAt === undefined) delete normalized.completedAt
  if (normalized.archivedAt === undefined) delete normalized.archivedAt
  return normalized
}

export class CardService {
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

  async create(input: unknown): Promise<Card> {
    if (!isRecord(input))
      throw new ValidationError('card', 'Card input must be an object.')
    const parsed: CardInput = parseCardInput(input)
    const tagIds = hasOwn(input, 'tagIds') ? parseTagIds(input.tagIds) : []

    return this.transactions.write(
      ['cards', 'categories', 'tags', 'cardTags'],
      async () => {
        await this.requireReferences(parsed.categoryId, tagIds)
        const timestamp = timestampNow(this.context)
        const card: Card = withoutClearedFields({
          id: this.context.createId(),
          ...parsed,
          sortOrder: await this.nextSortOrder(parsed.status),
          createdAt: timestamp,
          updatedAt: timestamp,
          completedAt: parsed.status === 'DONE' ? timestamp : undefined,
        })
        await this.database.cards.add(card)
        if (tagIds.length > 0) {
          await this.database.cardTags.bulkAdd(
            tagIds.map((tagId) => ({ cardId: card.id, tagId })),
          )
        }
        return card
      },
    )
  }

  async update(cardId: string, input: unknown): Promise<Card> {
    const patch = parseCardUpdate(input)
    return this.transactions.write(
      ['cards', 'categories', 'tags', 'cardTags'],
      async () => {
        const current = await this.requireCard(cardId)
        const categoryId =
          patch.categoryId === null
            ? undefined
            : (patch.categoryId ?? current.categoryId)
        const tagIds =
          patch.tagIds ??
          (
            await this.database.cardTags
              .where('cardId')
              .equals(cardId)
              .toArray()
          ).map(({ tagId }) => tagId)
        await this.requireReferences(categoryId, tagIds)

        const status = patch.status ?? current.status
        const timestamp = timestampNow(this.context)
        let completedAt = current.completedAt
        if (status === 'DONE' && current.status !== 'DONE')
          completedAt = timestamp
        if (status !== 'DONE') completedAt = undefined

        const updated = withoutClearedFields({
          ...current,
          ...(patch.title === undefined ? {} : { title: patch.title }),
          ...(patch.description === undefined
            ? {}
            : { description: patch.description ?? undefined }),
          status,
          categoryId,
          ...(patch.priority === undefined ? {} : { priority: patch.priority }),
          ...(patch.dueDate === undefined
            ? {}
            : { dueDate: patch.dueDate ?? undefined }),
          sortOrder:
            patch.sortOrder ??
            (status !== current.status
              ? await this.nextSortOrder(status, cardId)
              : current.sortOrder),
          completedAt,
          updatedAt: timestamp,
        })
        await this.database.cards.put(updated)

        if (patch.tagIds !== undefined) {
          await this.database.cardTags.where('cardId').equals(cardId).delete()
          if (tagIds.length > 0) {
            await this.database.cardTags.bulkAdd(
              tagIds.map((tagId) => ({ cardId, tagId })),
            )
          }
        }
        return updated
      },
    )
  }

  setStatus(
    cardId: string,
    status: CardStatus,
    sortOrder?: number,
  ): Promise<Card> {
    return this.update(cardId, {
      status,
      ...(sortOrder === undefined ? {} : { sortOrder }),
    })
  }

  setSortOrder(cardId: string, sortOrder: number): Promise<Card> {
    return this.update(cardId, { sortOrder })
  }

  archive(cardId: string): Promise<Card> {
    return this.setArchived(cardId, true)
  }

  restore(cardId: string): Promise<Card> {
    return this.setArchived(cardId, false)
  }

  async deletePermanently(cardId: string): Promise<void> {
    await this.transactions.write(
      ['cards', 'cardTags', 'workLogs'],
      async () => {
        await this.requireCard(cardId)
        await this.database.cardTags.where('cardId').equals(cardId).delete()
        await this.database.workLogs.where('cardId').equals(cardId).delete()
        await this.database.cards.delete(cardId)
      },
    )
  }

  private async setArchived(cardId: string, archived: boolean): Promise<Card> {
    return this.transactions.write(['cards'], async () => {
      const current = await this.requireCard(cardId)
      const timestamp = timestampNow(this.context)
      const updated = withoutClearedFields({
        ...current,
        updatedAt: timestamp,
        archivedAt: archived ? timestamp : undefined,
      })
      await this.database.cards.put(updated)
      return updated
    })
  }

  private async requireCard(cardId: string): Promise<Card> {
    const card = await this.database.cards.get(cardId)
    if (!card) throw new DomainError('NOT_FOUND', 'Card', cardId)
    return card
  }

  private async requireReferences(
    categoryId: string | undefined,
    tagIds: readonly string[],
  ): Promise<void> {
    if (categoryId && !(await this.database.categories.get(categoryId)))
      throw new DomainError('INVALID_REFERENCE', 'Category', categoryId)
    if (tagIds.length === 0) return
    const tags = await this.database.tags.bulkGet([...tagIds])
    const missingIndex = tags.findIndex((tag) => tag === undefined)
    if (missingIndex >= 0)
      throw new DomainError('INVALID_REFERENCE', 'Tag', tagIds[missingIndex])
  }

  private async nextSortOrder(
    status: CardStatus,
    excludingCardId?: string,
  ): Promise<number> {
    const cards = await this.database.cards.where('status').equals(status).toArray()
    const visibleOrders = cards
      .filter(
        (card) =>
          card.archivedAt === undefined && card.id !== excludingCardId,
      )
      .map(({ sortOrder }) => sortOrder)
    return visibleOrders.length === 0 ? 0 : Math.max(...visibleOrders) + 1
  }
}
