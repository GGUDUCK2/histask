import type { Card, CardTag, Category, Tag, WorkLog } from './domain'

export const BACKUP_APP = 'Histask' as const
export const BACKUP_SCHEMA_VERSION = 1 as const
export const BACKUP_MIME_TYPE = 'application/json' as const

export interface BackupPayload {
  app: typeof BACKUP_APP
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  categories: Category[]
  tags: Tag[]
  cardTags: CardTag[]
  cards: Card[]
  workLogs: WorkLog[]
}

export interface BackupExport {
  filename: string
  mimeType: typeof BACKUP_MIME_TYPE
  json: string
  payload: BackupPayload
}

export interface BackupCollectionCounts {
  categories: number
  tags: number
  cardTags: number
  cards: number
  workLogs: number
}
