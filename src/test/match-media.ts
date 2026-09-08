import { vi } from 'vitest'

export function installMatchMedia(initialDark = false) {
  let dark = initialDark
  const listeners = new Set<() => void>()
  const media = {
    get matches() {
      return dark
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: () => void) =>
      listeners.add(listener),
    ),
    removeEventListener: vi.fn((_type: string, listener: () => void) =>
      listeners.delete(listener),
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  )
  return {
    media,
    change(value: boolean) {
      dark = value
      listeners.forEach((listener) => listener())
    },
    listenerCount: () => listeners.size,
  }
}
