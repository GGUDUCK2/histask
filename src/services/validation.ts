import {
  CARD_STATUSES,
  PRIORITIES,
  DEFAULT_CARD_STATUS,
  DEFAULT_PRIORITY,
  CLASSIFICATION_COLORS,
  type ClassificationColor,
  type CardStatus,
  type Priority,
  type CardInput,
  type WorkLogInput,
} from '@/types/domain'
import { isDateOnly, isIsoTimestamp } from '@/utils/dates'

export class ValidationError extends Error {
  readonly field: string
  constructor(field: string, message: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export function isCardStatus(value: unknown): value is CardStatus {
  return CARD_STATUSES.some((status) => status === value)
}
export function isPriority(value: unknown): value is Priority {
  return PRIORITIES.some((priority) => priority === value)
}
export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new ValidationError(field, `${field} is required.`)
  // Validate blank input without truncating or rewriting the user's content.
  return value
}
export function optionalText(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string')
    throw new ValidationError(field, `${field} must be text.`)
  return value
}
export function requireTimestamp(value: unknown, field: string): string {
  if (!isIsoTimestamp(value))
    throw new ValidationError(field, `${field} must be an ISO timestamp.`)
  return value
}
export function requireSortOrder(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new ValidationError('sortOrder', 'Sort order must be finite.')
  return value
}
export function isClassificationColor(
  value: unknown,
): value is ClassificationColor {
  return (
    typeof value === 'string' &&
    CLASSIFICATION_COLORS.some((color) => color === value)
  )
}
export function requireClassificationColor(
  value: unknown,
  field = 'color',
): ClassificationColor {
  if (!isClassificationColor(value))
    throw new ValidationError(field, 'Choose a valid classification color.')
  return value
}
export function parseCardInput(value: unknown): CardInput {
  if (!isRecord(value))
    throw new ValidationError('card', 'Card input must be an object.')
  const status = value.status === undefined ? DEFAULT_CARD_STATUS : value.status
  const priority =
    value.priority === undefined ? DEFAULT_PRIORITY : value.priority
  if (!isCardStatus(status))
    throw new ValidationError('status', 'Choose a valid status.')
  if (!isPriority(priority))
    throw new ValidationError('priority', 'Choose a valid priority.')
  const dueDate = value.dueDate
  if (dueDate !== undefined && !isDateOnly(dueDate))
    throw new ValidationError('dueDate', 'Choose a valid calendar date.')
  return {
    title: requireText(value.title, 'title'),
    description: optionalText(value.description, 'description'),
    categoryId:
      value.categoryId === undefined
        ? undefined
        : requireText(value.categoryId, 'categoryId'),
    status,
    priority,
    dueDate,
  }
}
export function parseWorkLogInput(value: unknown): WorkLogInput {
  if (!isRecord(value))
    throw new ValidationError('workLog', 'WorkLog input must be an object.')
  return {
    cardId: requireText(value.cardId, 'cardId'),
    content: requireText(value.content, 'content'),
  }
}
