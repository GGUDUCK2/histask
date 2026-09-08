export type StoragePersistenceStatus =
  | 'unsupported'
  | 'persisted'
  | 'not-persisted'
  | 'denied'
  | 'error'

interface StorageManagerLike {
  persisted?: () => Promise<boolean>
  persist?: () => Promise<boolean>
}

export class StoragePersistenceService {
  private readonly storage: StorageManagerLike | undefined

  constructor(storage?: StorageManagerLike) {
    this.storage =
      storage ??
      (typeof navigator === 'undefined' ? undefined : navigator.storage)
  }

  async check(): Promise<StoragePersistenceStatus> {
    if (typeof this.storage?.persisted !== 'function') return 'unsupported'
    try {
      return (await this.storage.persisted()) ? 'persisted' : 'not-persisted'
    } catch {
      return 'error'
    }
  }

  async request(): Promise<StoragePersistenceStatus> {
    if (typeof this.storage?.persist !== 'function') return 'unsupported'
    try {
      return (await this.storage.persist()) ? 'persisted' : 'denied'
    } catch {
      return 'error'
    }
  }
}
