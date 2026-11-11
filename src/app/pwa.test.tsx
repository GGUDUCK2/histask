import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initPwaRegistration, resetPwaStateForTest } from '@/app/pwa'
import { PwaUpdateBanner } from '@/components/layout/PwaUpdateBanner'

afterEach(() => {
  resetPwaStateForTest()
})

describe('PWA update prompt', () => {
  it('shows non-disruptive update prompt on needRefresh and reloads only on confirmation', async () => {
    const originalServiceWorker = navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    })

    try {
      const updateSpy = vi.fn(async () => {})
      let capturedCallbacks: { onNeedRefresh?: () => void } = {}

      initPwaRegistration((options) => {
        capturedCallbacks = options ?? {}
        return updateSpy
      })

      render(<PwaUpdateBanner />)
      expect(
        screen.queryByRole('complementary', {
          name: 'Application update available',
        }),
      ).toBeNull()

      act(() => {
        capturedCallbacks.onNeedRefresh?.()
      })

      expect(
        screen.getByRole('complementary', {
          name: 'Application update available',
        }),
      ).toBeVisible()
      expect(updateSpy).not.toHaveBeenCalled()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Reload' }))
      expect(updateSpy).toHaveBeenCalledWith(true)
    } finally {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: originalServiceWorker,
      })
    }
  })
})
