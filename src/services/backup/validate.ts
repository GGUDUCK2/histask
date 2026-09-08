import {
  BACKUP_APP,
  BACKUP_SCHEMA_VERSION,
  type BackupPayload,
} from '@/types/backup'
import type { Card, CardTag, Category, Tag, WorkLog } from '@/types/domain'
import { isDateOnly, isIsoTimestamp } from '@/utils/dates'
import {
  isCardStatus,
  isClassificationColor,
  isPriority,
  isRecord,
} from '../validation'
import { BackupValidationError } from './errors'

function invalidField(path: string): never {
  throw new BackupValidationError('INVALID_FIELD', path)
}

function requiredText(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) return invalidField(path)
  return value
}

function optionalText(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') return invalidField(path)
  return value
}

function timestamp(value: unknown, path: string): string {
  if (!isIsoTimestamp(value)) return invalidField(path)
  return value
}

function optionalTimestamp(
  value: unknown,
  path: string,
): string | undefined {
  if (value === undefined) return undefined
  return timestamp(value, path)
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new BackupValidationError('INVALID_FORMAT', path)
  return value
}

function array<T>(
  value: unknown,
  path: string,
  validateItem: (item: unknown, path: string) => T,
): T[] {
  if (!Array.isArray(value))
    throw new BackupValidationError('INVALID_FORMAT', path)
  return value.map((item, index) => validateItem(item, `${path}[${index}]`))
}

function validateCard(value: unknown, path: string): Card {
  const item = record(value, path)
  if (!isCardStatus(item.status)) invalidField(`${path}.status`)
  if (!isPriority(item.priority)) invalidField(`${path}.priority`)
  if (typeof item.sortOrder !== 'number' || !Number.isFinite(item.sortOrder))
    invalidField(`${path}.sortOrder`)
  if (item.dueDate !== undefined && !isDateOnly(item.dueDate))
    invalidField(`${path}.dueDate`)

  const completedAt = optionalTimestamp(
    item.completedAt,
    `${path}.completedAt`,
  )
  if (
    (item.status === 'DONE' && completedAt === undefined) ||
    (item.status !== 'DONE' && completedAt !== undefined)
  )
    throw new BackupValidationError('INVALID_STATE', `${path}.completedAt`)

  const categoryId =
    item.categoryId === undefined
      ? undefined
      : requiredText(item.categoryId, `${path}.categoryId`)
  const description = optionalText(item.description, `${path}.description`)
  const archivedAt = optionalTimestamp(item.archivedAt, `${path}.archivedAt`)
  return {
    id: requiredText(item.id, `${path}.id`),
    title: requiredText(item.title, `${path}.title`),
    ...(description === undefined ? {} : { description }),
    status: item.status,
    ...(categoryId === undefined ? {} : { categoryId }),
    priority: item.priority,
    ...(item.dueDate === undefined ? {} : { dueDate: item.dueDate }),
    sortOrder: item.sortOrder,
    createdAt: timestamp(item.createdAt, `${path}.createdAt`),
    updatedAt: timestamp(item.updatedAt, `${path}.updatedAt`),
    ...(completedAt === undefined ? {} : { completedAt }),
    ...(archivedAt === undefined ? {} : { archivedAt }),
  }
}

function validateCategory(value: unknown, path: string): Category {
  const item = record(value, path)
  if (item.color !== undefined && !isClassificationColor(item.color))
    invalidField(`${path}.color`)
  return {
    id: requiredText(item.id, `${path}.id`),
    name: requiredText(item.name, `${path}.name`),
    ...(item.color === undefined ? {} : { color: item.color }),
    createdAt: timestamp(item.createdAt, `${path}.createdAt`),
    updatedAt: timestamp(item.updatedAt, `${path}.updatedAt`),
  }
}

function validateTag(value: unknown, path: string): Tag {
  const item = record(value, path)
  if (item.color !== undefined && !isClassificationColor(item.color))
    invalidField(`${path}.color`)
  return {
    id: requiredText(item.id, `${path}.id`),
    name: requiredText(item.name, `${path}.name`),
    ...(item.color === undefined ? {} : { color: item.color }),
    createdAt: timestamp(item.createdAt, `${path}.createdAt`),
  }
}

function validateCardTag(value: unknown, path: string): CardTag {
  const item = record(value, path)
  return {
    cardId: requiredText(item.cardId, `${path}.cardId`),
    tagId: requiredText(item.tagId, `${path}.tagId`),
  }
}

function validateWorkLog(value: unknown, path: string): WorkLog {
  const item = record(value, path)
  return {
    id: requiredText(item.id, `${path}.id`),
    cardId: requiredText(item.cardId, `${path}.cardId`),
    content: requiredText(item.content, `${path}.content`),
    createdAt: timestamp(item.createdAt, `${path}.createdAt`),
    updatedAt: timestamp(item.updatedAt, `${path}.updatedAt`),
  }
}

function ensureUniqueIds(
  entities: readonly { id: string }[],
  collection: string,
): Set<string> {
  const ids = new Set<string>()
  entities.forEach(({ id }, index) => {
    if (ids.has(id))
      throw new BackupValidationError(
        'DUPLICATE_ID',
        `$.${collection}[${index}].id`,
      )
    ids.add(id)
  })
  return ids
}

function validateRelations(payload: BackupPayload): void {
  const categoryIds = ensureUniqueIds(payload.categories, 'categories')
  const tagIds = ensureUniqueIds(payload.tags, 'tags')
  const cardIds = ensureUniqueIds(payload.cards, 'cards')
  ensureUniqueIds(payload.workLogs, 'workLogs')
  const relations = new Set<string>()

  payload.cards.forEach((card, index) => {
    if (card.categoryId !== undefined && !categoryIds.has(card.categoryId))
      throw new BackupValidationError(
        'INVALID_REFERENCE',
        `$.cards[${index}].categoryId`,
      )
  })
  payload.cardTags.forEach(({ cardId, tagId }, index) => {
    if (!cardIds.has(cardId))
      throw new BackupValidationError(
        'INVALID_REFERENCE',
        `$.cardTags[${index}].cardId`,
      )
    if (!tagIds.has(tagId))
      throw new BackupValidationError(
        'INVALID_REFERENCE',
        `$.cardTags[${index}].tagId`,
      )
    const key = JSON.stringify([cardId, tagId])
    if (relations.has(key))
      throw new BackupValidationError(
        'DUPLICATE_RELATION',
        `$.cardTags[${index}]`,
      )
    relations.add(key)
  })
  payload.workLogs.forEach(({ cardId }, index) => {
    if (!cardIds.has(cardId))
      throw new BackupValidationError(
        'INVALID_REFERENCE',
        `$.workLogs[${index}].cardId`,
      )
  })
}

export function validateBackupPayload(value: unknown): BackupPayload {
  const input = record(value, '$')
  if (input.app !== BACKUP_APP)
    throw new BackupValidationError('UNSUPPORTED_APP', '$.app')
  if (input.schemaVersion !== BACKUP_SCHEMA_VERSION)
    throw new BackupValidationError(
      'UNSUPPORTED_VERSION',
      '$.schemaVersion',
    )

  const payload: BackupPayload = {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: timestamp(input.exportedAt, '$.exportedAt'),
    categories: array(input.categories, '$.categories', validateCategory),
    tags: array(input.tags, '$.tags', validateTag),
    cardTags: array(input.cardTags, '$.cardTags', validateCardTag),
    cards: array(input.cards, '$.cards', validateCard),
    workLogs: array(input.workLogs, '$.workLogs', validateWorkLog),
  }
  validateRelations(payload)
  return payload
}

export function parseBackupJson(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch (error) {
    throw new BackupValidationError('INVALID_JSON', '$', error)
  }
}
