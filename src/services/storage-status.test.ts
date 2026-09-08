import { describe, expect, it, vi } from 'vitest'
import { StoragePersistenceService } from './storage-status'

describe('StoragePersistenceService', () => {
  it('reports unsupported methods', async () => {
    const service = new StoragePersistenceService({})
    await expect(service.check()).resolves.toBe('unsupported')
    await expect(service.request()).resolves.toBe('unsupported')
  })

  it.each([
    [true, 'persisted'],
    [false, 'not-persisted'],
  ] as const)('maps persisted()=%s to %s', async (value, expected) => {
    const service = new StoragePersistenceService({
      persisted: vi.fn().mockResolvedValue(value),
    })
    await expect(service.check()).resolves.toBe(expected)
  })

  it.each([
    [true, 'persisted'],
    [false, 'denied'],
  ] as const)('maps persist()=%s to %s', async (value, expected) => {
    const service = new StoragePersistenceService({
      persist: vi.fn().mockResolvedValue(value),
    })
    await expect(service.request()).resolves.toBe(expected)
  })

  it('reports browser API failures without throwing', async () => {
    const service = new StoragePersistenceService({
      persisted: vi.fn().mockRejectedValue(new Error('blocked')),
      persist: vi.fn().mockRejectedValue(new Error('blocked')),
    })
    await expect(service.check()).resolves.toBe('error')
    await expect(service.request()).resolves.toBe('error')
  })
})
