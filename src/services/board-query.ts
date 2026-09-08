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

function compareCardsManual(left: Card, right: Card): number {
  return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
}

export class BoardQueryService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner

  constructor(database: HistaskDatabase) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
  }

  getCards(): Promise<BoardCardProjection[]> {
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
        const categoryById = new Map(
          categories.map((category) => [category.id, category]),
        )
        const tagById = new Map(tags.map((tag) => [tag.id, tag]))
        const tagIdsByCard = new Map<string, string[]>()
        const logsByCard = new Map<string, WorkLog[]>()

        for (const relation of relations) {
          if (!cardIds.has(relation.cardId)) continue
          const cardTagIds = tagIdsByCard.get(relation.cardId) ?? []
          cardTagIds.push(relation.tagId)
          tagIdsByCard.set(relation.cardId, cardTagIds)
        }
        for (const log of logs) {
          if (!cardIds.has(log.cardId)) continue
          const cardLogs = logsByCard.get(log.cardId) ?? []
          cardLogs.push(log)
          logsByCard.set(log.cardId, cardLogs)
        }

        return cards.map((card) => {
          const cardLogs = (logsByCard.get(card.id) ?? []).sort(
            compareWorkLogsNewestFirst,
          )
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
      },
    )
  }

  observeCards(): RepositoryQuery<BoardCardProjection[]> {
    return createRepositoryQuery('observe board cards', () => this.getCards())
  }
}
