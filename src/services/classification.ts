import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import type {
  Card,
  CardTag,
  Category,
  ClassificationColor,
  Tag,
} from '@/types/domain'
import { DomainError } from './domain-errors'
import {
  defaultServiceContext,
  timestampNow,
  type ServiceContext,
} from './service-context'
import {
  isRecord,
  requireClassificationColor,
  requireText,
  ValidationError,
} from './validation'

interface ClassificationInput {
  name: string
  color?: ClassificationColor
}

interface ClassificationUpdate {
  name?: string
  color?: ClassificationColor | null
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function parseCreateInput(value: unknown): ClassificationInput {
  if (!isRecord(value))
    throw new ValidationError('classification', 'Input must be an object.')
  return {
    name: requireText(value.name, 'name'),
    ...(value.color === undefined
      ? {}
      : { color: requireClassificationColor(value.color) }),
  }
}

function parseUpdateInput(value: unknown): ClassificationUpdate {
  if (!isRecord(value))
    throw new ValidationError('classification', 'Changes must be an object.')
  const patch: ClassificationUpdate = {}
  if (hasOwn(value, 'name')) patch.name = requireText(value.name, 'name')
  if (hasOwn(value, 'color')) {
    patch.color =
      value.color === null ? null : requireClassificationColor(value.color)
  }
  if (Object.keys(patch).length === 0)
    throw new ValidationError(
      'classification',
      'Provide at least one classification change.',
    )
  return patch
}

function withoutColor<T extends Category | Tag>(entity: T): T {
  if (entity.color !== undefined) return entity
  const normalized = { ...entity }
  delete normalized.color
  return normalized
}

export class ClassificationService {
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

  async createCategory(input: unknown): Promise<Category> {
    const parsed = parseCreateInput(input)
    return this.transactions.write(['categories'], async () => {
      const timestamp = timestampNow(this.context)
      const category: Category = {
        id: this.context.createId(),
        ...parsed,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await this.database.categories.add(category)
      return category
    })
  }

  async updateCategory(categoryId: string, input: unknown): Promise<Category> {
    const patch = parseUpdateInput(input)
    return this.transactions.write(['categories'], async () => {
      const current = await this.requireCategory(categoryId)
      const updated = withoutColor<Category>({
        ...current,
        ...(patch.name === undefined ? {} : { name: patch.name }),
        ...(patch.color === undefined
          ? {}
          : { color: patch.color ?? undefined }),
        updatedAt: timestampNow(this.context),
      })
      await this.database.categories.put(updated)
      return updated
    })
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.transactions.write(['cards', 'categories'], async () => {
      await this.requireCategory(categoryId)
      const timestamp = timestampNow(this.context)
      const cards = await this.database.cards
        .where('categoryId')
        .equals(categoryId)
        .toArray()
      if (cards.length > 0) {
        await this.database.cards.bulkPut(
          cards.map((card) => this.clearCategory(card, timestamp)),
        )
      }
      await this.database.categories.delete(categoryId)
    })
  }

  async createTag(input: unknown): Promise<Tag> {
    const parsed = parseCreateInput(input)
    return this.transactions.write(['tags'], async () => {
      const tag: Tag = {
        id: this.context.createId(),
        ...parsed,
        createdAt: timestampNow(this.context),
      }
      await this.database.tags.add(tag)
      return tag
    })
  }

  async updateTag(tagId: string, input: unknown): Promise<Tag> {
    const patch = parseUpdateInput(input)
    return this.transactions.write(['tags'], async () => {
      const current = await this.requireTag(tagId)
      const updated = withoutColor<Tag>({
        ...current,
        ...(patch.name === undefined ? {} : { name: patch.name }),
        ...(patch.color === undefined
          ? {}
          : { color: patch.color ?? undefined }),
      })
      await this.database.tags.put(updated)
      return updated
    })
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.transactions.write(['tags', 'cardTags'], async () => {
      await this.requireTag(tagId)
      await this.database.cardTags.where('tagId').equals(tagId).delete()
      await this.database.tags.delete(tagId)
    })
  }

  async attachTag(cardId: string, tagId: string): Promise<CardTag> {
    return this.transactions.write(
      ['cards', 'tags', 'cardTags'],
      async () => {
        await this.requireCard(cardId)
        await this.requireTag(tagId)
        const existing = await this.database.cardTags.get([cardId, tagId])
        if (existing)
          throw new DomainError(
            'DUPLICATE_RELATION',
            'CardTag',
            `${cardId}:${tagId}`,
          )
        const relation = { cardId, tagId }
        await this.database.cardTags.add(relation)
        return relation
      },
    )
  }

  async detachTag(cardId: string, tagId: string): Promise<void> {
    await this.transactions.write(
      ['cards', 'tags', 'cardTags'],
      async () => {
        await this.requireCard(cardId)
        await this.requireTag(tagId)
        await this.database.cardTags.delete([cardId, tagId])
      },
    )
  }

  private clearCategory(card: Card, updatedAt: string): Card {
    const updated = { ...card, updatedAt }
    delete updated.categoryId
    return updated
  }

  private async requireCard(cardId: string): Promise<Card> {
    const card = await this.database.cards.get(cardId)
    if (!card) throw new DomainError('NOT_FOUND', 'Card', cardId)
    return card
  }

  private async requireCategory(categoryId: string): Promise<Category> {
    const category = await this.database.categories.get(categoryId)
    if (!category)
      throw new DomainError('NOT_FOUND', 'Category', categoryId)
    return category
  }

  private async requireTag(tagId: string): Promise<Tag> {
    const tag = await this.database.tags.get(tagId)
    if (!tag) throw new DomainError('NOT_FOUND', 'Tag', tagId)
    return tag
  }
}
