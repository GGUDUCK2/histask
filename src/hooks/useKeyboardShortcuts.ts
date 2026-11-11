import { useEffect, useRef } from 'react'
import { isEditableElement, isImeComposing } from '@/utils/keyboard'

interface ShortcutHandlers {
  onNewTask: () => void
  onFocusSearch: () => void
  onEscape?: () => void
  isModalOpen?: () => boolean
}

export function useKeyboardShortcuts({
  onNewTask,
  onFocusSearch,
  onEscape,
  isModalOpen,
}: ShortcutHandlers) {
  const lastCompositionEndAtRef = useRef(0)

  useEffect(() => {
    function handleCompositionEnd(event: CompositionEvent) {
      lastCompositionEndAtRef.current = event.timeStamp
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isImeComposing(event, lastCompositionEndAtRef.current)) return

      if (event.key === 'Escape') {
        if (onEscape) onEscape()
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableElement(event.target)) return
      if (isModalOpen?.()) return

      if (event.key === '/') {
        event.preventDefault()
        onFocusSearch()
        return
      }

      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault()
        onNewTask()
      }
    }

    document.addEventListener('compositionend', handleCompositionEnd, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('compositionend', handleCompositionEnd, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen, onEscape, onFocusSearch, onNewTask])
}
