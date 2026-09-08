import { describe, expect, it } from 'vitest'
import {
  isCardStatus,
  isPriority,
  parseCardInput,
  parseWorkLogInput,
  requireSortOrder,
  requireTimestamp,
  requireText,
  ValidationError,
} from './validation'

describe('input contracts', () => {
  it('defaults title-only input to TODO/NONE without creating stored metadata', () => {
    const card = parseCardInput({ title: 'ERP 확인' })
    expect(card).toMatchObject({
      title: 'ERP 확인',
      status: 'TODO',
      priority: 'NONE',
    })
    expect(card).not.toHaveProperty('id')
    expect(card).not.toHaveProperty('latestWorkLog')
  })
  it.each([
    null,
    [],
    'card',
    {},
    { title: '' },
    { title: ' \n\t' },
    { title: 1 },
  ])('rejects invalid card input %j', (value) => {
    expect(() => parseCardInput(value)).toThrow(ValidationError)
  })
  it.each([
    { status: 'CUSTOM' },
    { status: null },
    { priority: 'URGENT' },
    { priority: null },
    { dueDate: '2026-02-29' },
    { dueDate: '2026-09-08T00:00:00Z' },
    { description: 3 },
    { categoryId: '' },
  ])('rejects invalid field %j', (field) => {
    expect(() => parseCardInput({ title: 'Task', ...field })).toThrow(
      ValidationError,
    )
  })
  it('preserves long multiline content and optional fields', () => {
    const content =
      '  진행 이력\nSQL <script>text only</script>\n' + '긴 내용 '.repeat(2000)
    expect(parseWorkLogInput({ cardId: 'card-1', content })).toEqual({
      cardId: 'card-1',
      content,
    })
    expect(
      parseCardInput({
        title: 'Task',
        description: content,
        status: 'WAITING',
        priority: 'HIGH',
        categoryId: 'category-1',
        dueDate: '2028-02-29',
      }),
    ).toMatchObject({ description: content, dueDate: '2028-02-29' })
  })
  it.each([
    {},
    { cardId: 'x', content: ' \n' },
    { cardId: '', content: 'log' },
    null,
  ])('rejects invalid WorkLog %j', (value) => {
    expect(() => parseWorkLogInput(value)).toThrow(ValidationError)
  })
  it('provides reusable enum/text/timestamp/finite sort guards', () => {
    expect(isCardStatus('DONE')).toBe(true)
    expect(isCardStatus('done')).toBe(false)
    expect(isPriority('NONE')).toBe(true)
    expect(isPriority('TOP')).toBe(false)
    expect(requireText('Category', 'name')).toBe('Category')
    expect(requireTimestamp('2026-09-08T01:32:22.123Z', 'createdAt')).toBe(
      '2026-09-08T01:32:22.123Z',
    )
    expect(() => requireTimestamp('yesterday', 'createdAt')).toThrow(
      ValidationError,
    )
    expect(requireSortOrder(1.5)).toBe(1.5)
    for (const value of [NaN, Infinity, -Infinity, '1', null])
      expect(() => requireSortOrder(value)).toThrow(ValidationError)
  })
})
