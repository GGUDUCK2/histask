import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

// Only the test environment gets an isolated in-memory IndexedDB factory.
Object.assign(globalThis, { indexedDB: new IDBFactory(), IDBKeyRange })
afterEach(() => {
  cleanup()
  Object.assign(globalThis, { indexedDB: new IDBFactory() })
})
