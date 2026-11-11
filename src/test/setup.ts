import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

// Only the test environment gets an isolated in-memory IndexedDB factory.
Object.assign(globalThis, { indexedDB: new IDBFactory(), IDBKeyRange })

// jsdom lacks pointer-capture and scrollIntoView APIs used by Radix Select.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}

afterEach(() => {
  cleanup()
  Object.assign(globalThis, { indexedDB: new IDBFactory() })
})
