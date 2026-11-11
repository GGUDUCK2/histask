import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

export function isImeComposing(
  event: Pick<KeyboardEvent, 'isComposing' | 'key' | 'timeStamp'>,
  lastCompositionEndAt: number,
): boolean {
  if (event.isComposing || event.key === 'Process') {
    return true
  }
  return (
    lastCompositionEndAt > 0 &&
    Math.abs(event.timeStamp - lastCompositionEndAt) < 50
  )
}

export function isReactImeComposing(
  event: ReactKeyboardEvent<HTMLElement>,
  lastCompositionEndAt: number,
): boolean {
  return isImeComposing(event.nativeEvent, lastCompositionEndAt)
}

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"], [role="listbox"], [role="textbox"]',
    )
  ) {
    return true
  }
  return target instanceof HTMLElement && target.isContentEditable
}
