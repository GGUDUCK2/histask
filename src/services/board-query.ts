import type { HistaskDatabase } from '@/db/database'
import {
  createRepositoryQuery,
  type RepositoryQuery,
} from '@/repositories/query'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import type { Card, Category, Tag, WorkLog } from '@/types/domain'
import { compareWorkLogsNewestFirst } from './worklogs'

export interface BoardCardProjection {
  card: Card
  category?: Category
  tags: Tag[]
  latestWorkLog?: WorkLog
  workLogCount: number
}

export interface WorkspaceSnapshot {
  cards: BoardCardProjection[]
  workLogsByCard: ReadonlyMap<string, readonly WorkLog[]>
  categories: Category[]
  tags: Tag[]
  categoryCardCounts: ReadonlyMap<string, number>
  tagCardCounts: ReadonlyMap<string, number>
}

export function compareCardsManual(left: Card, right: Card): number {
  return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
}

export class BoardQueryService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner

  constructor(database: HistaskDatabase) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
  }

  async getCards(): Promise<BoardCardProjection[]> {
    const snapshot = await this.getWorkspaceSnapshot()
    return snapshot.cards
  }

  observeCards(): RepositoryQuery<BoardCardProjection[]> {
    return createRepositoryQuery('observe board cards', () => this.getCards())
  }

  getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
    return this.transactions.read(
      ['cards', 'categories', 'tags', 'cardTags', 'workLogs'],
      async () => {
        const [allCards, categories, tags, relations, logs] =
          await Promise.all([
            this.database.cards.toArray(),
            this.database.categories.toArray(),
            this.database.tags.toArray(),
            this.database.cardTags.toArray(),
            this.database.workLogs.toArray(),
          ])
        const cards = allCards
          .filter(({ archivedAt }) => archivedAt === undefined)
          .sort(compareCardsManual)
        const cardIds = new Set(cards.map(({ id }) => id))
        const sortedCategories = [...categories].sort((left, right) =>
          left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
        )
        const sortedTags = [...tags].sort((left, right) =>
          left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
        )
        const categoryById = new Map(
          sortedCategories.map((category) => [category.id, category]),
        )
        const tagById = new Map(sortedTags.map((tag) => [tag.id, tag]))
        const tagIdsByCard = new Map<string, string[]>()
        const logsByCard = new Map<string, WorkLog[]>()
        const categoryCardCounts = new Map<string, number>()
        const tagCardCounts = new Map<string, number>()

        for (const card of cards) {
          if (card.categoryId && categoryById.has(card.categoryId)) {
            categoryCardCounts.set(
              card.categoryId,
              (categoryCardCounts.get(card.categoryId) ?? 0) + 1,
            )
          }
        }

        for (const relation of relations) {
          if (!cardIds.has(relation.cardId)) continue
          const cardTagIds = tagIdsByCard.get(relation.cardId) ?? []
          cardTagIds.push(relation.tagId)
          tagIdsByCard.set(relation.cardId, cardTagIds)
          if (tagById.has(relation.tagId)) {
            tagCardCounts.set(
              relation.tagId,
              (tagCardCounts.get(relation.tagId) ?? 0) + 1,
            )
          }
        }
        for (const log of logs) {
          if (!cardIds.has(log.cardId)) continue
          const cardLogs = logsByCard.get(log.cardId) ?? []
          cardLogs.push(log)
          logsByCard.set(log.cardId, cardLogs)
        }

        const sortedLogsByCard = new Map<string, readonly WorkLog[]>()
        const projections: BoardCardProjection[] = cards.map((card) => {
          const cardLogs = (logsByCard.get(card.id) ?? []).sort(
            compareWorkLogsNewestFirst,
          )
          sortedLogsByCard.set(card.id, cardLogs)
          const cardTags = (tagIdsByCard.get(card.id) ?? [])
            .map((tagId) => tagById.get(tagId))
            .filter((tag): tag is Tag => tag !== undefined)
            .sort((left, right) => left.name.localeCompare(right.name))
          return {
            card,
            category:
              card.categoryId === undefined
                ? undefined
                : categoryById.get(card.categoryId),
            tags: cardTags,
            latestWorkLog: cardLogs[0],
            workLogCount: cardLogs.length,
          }
        })

        return {
          cards: projections,
          workLogsByCard: sortedLogsByCard,
          categories: sortedCategories,
          tags: sortedTags,
          categoryCardCounts,
          tagCardCounts,
        }
      },
    )
  }

  observeWorkspaceSnapshot(): RepositoryQuery<WorkspaceSnapshot> {
    return createRepositoryQuery('observe workspace snapshot', () =>
      this.getWorkspaceSnapshot(),
    )
  }
}
