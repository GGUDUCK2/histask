import type { Transaction } from 'dexie'
import type { Card, Category, Tag, WorkLog } from '@/types/domain'
import { normalizeIsoTimestamp } from '@/utils/dates'

function normalizeHistory(entity: { createdAt: string; updatedAt: string }): void {
  entity.createdAt = normalizeIsoTimestamp(entity.createdAt)
  entity.updatedAt = normalizeIsoTimestamp(entity.updatedAt)
}

/** Dexie runs the entire upgrade atomically; invalid data aborts without deletion. */
export async function normalizeStoredTimestamps(transaction: Transaction): Promise<void> {
  await transaction.table<Card>('cards').toCollection().modify(card => {
    normalizeHistory(card)
    if (card.completedAt !== undefined)
      card.completedAt = normalizeIsoTimestamp(card.completedAt)
    if (card.archivedAt !== undefined)
      card.archivedAt = normalizeIsoTimestamp(card.archivedAt)
  })
  await transaction.table<Category>('categories').toCollection().modify(normalizeHistory)
  await transaction.table<Tag>('tags').toCollection().modify(tag => {
    tag.createdAt = normalizeIsoTimestamp(tag.createdAt)
  })
  await transaction.table<WorkLog>('workLogs').toCollection().modify(normalizeHistory)
}
