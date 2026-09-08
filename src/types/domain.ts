export const CARD_STATUSES = ['TODO', 'IN_PROGRESS', 'WAITING', 'DONE'] as const
export type CardStatus = (typeof CARD_STATUSES)[number]
export const PRIORITIES = ['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const
export type Priority = (typeof PRIORITIES)[number]

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  WAITING: 'Waiting',
  DONE: 'Done',
}
export const PRIORITY_LABELS: Record<Priority, string> = {
  NONE: 'None',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}
export const DEFAULT_CARD_STATUS: CardStatus = 'TODO'
export const DEFAULT_PRIORITY: Priority = 'NONE'

export const CLASSIFICATION_COLORS = [
  'slate',
  'indigo',
  'blue',
  'teal',
  'amber',
  'rose',
] as const
export type ClassificationColor = (typeof CLASSIFICATION_COLORS)[number]

/** Timestamps are ISO strings; dueDate is an ISO calendar date (YYYY-MM-DD). */
export interface Card {
  id: string
  title: string
  description?: string
  status: CardStatus
  categoryId?: string
  priority: Priority
  dueDate?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  archivedAt?: string
}

export interface WorkLog {
  id: string
  cardId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color?: ClassificationColor
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color?: ClassificationColor
  createdAt: string
}

export interface CardTag {
  cardId: string
  tagId: string
}

export type CardInput = Pick<
  Card,
  'title' | 'description' | 'status' | 'categoryId' | 'priority' | 'dueDate'
>
export type WorkLogInput = Pick<WorkLog, 'cardId' | 'content'>
