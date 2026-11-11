import { registerSW } from 'virtual:pwa-register'

export interface PwaState {
  needRefresh: boolean
  offlineReady: boolean
}

let state: PwaState = {
  needRefresh: false,
  offlineReady: false,
}

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
let initialized = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  emit()
}

export function subscribePwaState(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPwaSnapshot(): PwaState {
  return state
}

export function initPwaRegistration(
  register: typeof registerSW = registerSW,
): void {
  if (initialized) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  initialized = true
  updateServiceWorker = register({
    onNeedRefresh() {
      setState({ needRefresh: true })
    },
    onOfflineReady() {
      setState({ offlineReady: true })
    },
  })
}

export async function applyPwaUpdate(): Promise<void> {
  setState({ needRefresh: false })
  await updateServiceWorker?.(true)
}

export function dismissPwaUpdate(): void {
  setState({ needRefresh: false })
}

export function resetPwaStateForTest(): void {
  initialized = false
  updateServiceWorker = null
  state = { needRefresh: false, offlineReady: false }
  emit()
}
