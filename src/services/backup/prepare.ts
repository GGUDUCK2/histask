import type { BackupPayload } from '@/types/backup'
import { validateBackupPayload } from './validate'

function clonePayload(payload: BackupPayload): BackupPayload {
  return {
    app: payload.app,
    schemaVersion: payload.schemaVersion,
    exportedAt: payload.exportedAt,
    categories: payload.categories.map((category) => ({ ...category })),
    tags: payload.tags.map((tag) => ({ ...tag })),
    cardTags: payload.cardTags.map((relation) => ({ ...relation })),
    cards: payload.cards.map((card) => ({ ...card })),
    workLogs: payload.workLogs.map((workLog) => ({ ...workLog })),
  }
}

export class PreparedBackup {
  readonly counts: Readonly<{
    categories: number
    tags: number
    cardTags: number
    cards: number
    workLogs: number
  }>
  readonly #payload: BackupPayload

  private constructor(payload: BackupPayload) {
    this.#payload = clonePayload(payload)
    this.counts = Object.freeze({
      categories: payload.categories.length,
      tags: payload.tags.length,
      cardTags: payload.cardTags.length,
      cards: payload.cards.length,
      workLogs: payload.workLogs.length,
    })
  }

  static fromUnknown(value: unknown): PreparedBackup {
    return new PreparedBackup(validateBackupPayload(value))
  }

  toPayload(): BackupPayload {
    return clonePayload(this.#payload)
  }
}

export function prepareBackup(value: unknown): PreparedBackup {
  return PreparedBackup.fromUnknown(value)
}

export function isPreparedBackup(value: unknown): value is PreparedBackup {
  return value instanceof PreparedBackup
}
