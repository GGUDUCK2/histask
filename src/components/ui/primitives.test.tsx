import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/app/ThemeProvider'
import { FoundationPreview } from '@/test/fixtures/FoundationPreview'
import { installMatchMedia } from '@/test/match-media'

function renderControls() {
  installMatchMedia()
  return render(
    <ThemeProvider>
      <FoundationPreview />
    </ThemeProvider>,
  )
}
afterEach(() => vi.unstubAllGlobals())
it('labels text controls, exposes validation, and keeps disabled inputs inert', async () => {
  renderControls()
  const user = userEvent.setup()
  const input = screen.getByRole('textbox', { name: '기본 입력' })
  await user.type(input, '한국어 English')
  expect(input).toHaveValue('한국어 English')
  expect(screen.getByRole('textbox', { name: '입력 오류' })).toBeInvalid()
  expect(
    screen.getByRole('textbox', { name: '입력 오류' }),
  ).toHaveAccessibleDescription('필수 내용을 입력하세요.')
  expect(screen.getByRole('textbox', { name: '비활성 입력' })).toBeDisabled()
  const textarea = screen.getByRole('textbox', { name: '여러 줄 입력' })
  await user.type(textarea, 'one{Enter}two')
  expect(textarea).toHaveValue('one\ntwo')
})
it.each(['Dialog', 'Sheet'])(
  '%s traps focus, closes on Esc and restores the trigger',
  async (name) => {
    renderControls()
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: `${name} 확인` })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: `공통 ${name}` })
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    )
    for (let i = 0; i < 6; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  },
)
it('opens tooltip with keyboard focus and closes it with Esc', async () => {
  renderControls()
  const user = userEvent.setup()
  const trigger = screen.getByRole('button', { name: 'Tooltip 확인' })
  // Walk the real tab order instead of manually setting tooltip state.
  for (let i = 0; i < 24 && document.activeElement !== trigger; i++)
    await user.tab()
  expect(trigger).toHaveFocus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('키보드 focus')
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})
it('opens and dismisses a popover without losing the trigger focus', async () => {
  renderControls()
  const user = userEvent.setup()
  const trigger = screen.getByRole('button', { name: 'Popover 확인' })
  await user.click(trigger)
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Popover 입력' })).toHaveFocus(),
  )
  await user.keyboard('{Escape}')
  expect(trigger).toHaveFocus()
})
