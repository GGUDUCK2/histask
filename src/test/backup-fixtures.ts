import type { BackupPayload } from '@/types/backup'
import {
  cardFixture,
  categoryFixture,
  tagFixture,
  workLogFixture,
} from './domain-fixtures'

export function backupPayloadFixture(
  overrides: Partial<BackupPayload> = {},
): BackupPayload {
  const category = categoryFixture({ id: 'category-1' })
  const tag = tagFixture({ id: 'tag-1' })
  const card = cardFixture({
    id: 'card-1',
    categoryId: category.id,
    status: 'IN_PROGRESS',
  })
  const workLog = workLogFixture({
    id: 'log-1',
    cardId: card.id,
    content: 'SQL 수정\n회귀 테스트 완료',
  })
  return {
    app: 'Histask',
    schemaVersion: 1,
    exportedAt: '2026-09-08T10:00:00.000Z',
    categories: [category],
    tags: [tag],
    cardTags: [{ cardId: card.id, tagId: tag.id }],
    cards: [card],
    workLogs: [workLog],
    ...overrides,
  }
}
