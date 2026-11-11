import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CARD_FILTER_STATE,
  type CardFilterState,
  type CardSearchEntry,
} from '@/types/card-query'
import {
  cardFixture,
  categoryFixture,
  tagFixture,
  workLogFixture,
} from '@/test/domain-fixtures'
import {
  filterCardProjections,
  pruneDeletedClassificationFilters,
} from './card-filters'
import { searchCards } from './card-search'
import { queryCardProjections, sortCardProjections } from './card-sort'

function entryFixture(
  overrides: {
    card?: Parameters<typeof cardFixture>[0]
    categoryName?: string
    categoryId?: string
    tagNames?: string[]
    workLogs?: Array<Parameters<typeof workLogFixture>[0]>
  } = {},
): CardSearchEntry {
  const card = cardFixture(overrides.card)
  const category =
    overrides.categoryName === undefined
      ? undefined
      : categoryFixture({
          id: overrides.categoryId ?? card.categoryId ?? 'cat-1',
          name: overrides.categoryName,
        })
  const tags = (overrides.tagNames ?? []).map((name, index) =>
    tagFixture({ id: `tag-${card.id}-${index}`, name }),
  )
  const workLogs = (overrides.workLogs ?? []).map((log) =>
    workLogFixture({ cardId: card.id, ...log }),
  )

  return {
    projection: {
      card: {
        ...card,
        ...(category ? { categoryId: category.id } : {}),
      },
      category,
      tags,
      latestWorkLog: workLogs[0],
      workLogCount: workLogs.length,
    },
    workLogs,
  }
}

describe('card query search, filters, and sort', () => {
  it('searches across title, description, category, tag, and WorkLogs without duplicates', () => {
    const entries: CardSearchEntry[] = [
      entryFixture({
        card: { id: 'c-title', title: 'Cloudflare Pages deploy' },
      }),
      entryFixture({
        card: {
          id: 'c-desc',
          title: 'Setup checklist',
          description: 'Review cache headers for CDN',
        },
      }),
      entryFixture({
        card: { id: 'c-cat', title: 'Invoice sync', categoryId: 'cat-ops' },
        categoryId: 'cat-ops',
        categoryName: 'Platform Ops',
      }),
      entryFixture({
        card: { id: 'c-tag', title: 'Login copy' },
        tagNames: ['korean-i18n', 'copywriting'],
      }),
      entryFixture({
        card: { id: 'c-log', title: 'API rate limit' },
        workLogs: [
          {
            id: 'log-newest',
            content: '한글 검색과 retry 테스트 통과',
            createdAt: '2026-09-08T10:00:00.000Z',
          },
          {
            id: 'log-older',
            content: '초기 retry 분석 완료',
            createdAt: '2026-09-08T08:00:00.000Z',
          },
        ],
      }),
      entryFixture({
        card: {
          id: 'c-archived',
          title: 'Cloudflare legacy',
          archivedAt: '2026-09-08T01:00:00.000Z',
        },
      }),
    ]

    expect(searchCards(entries, 'CLOUDFLARE').map((r) => r.projection.card.id)).toEqual([
      'c-title',
    ])
    expect(searchCards(entries, 'headers').map((r) => r.excerpt.source)).toEqual([
      'description',
    ])
    expect(searchCards(entries, 'platform ops').map((r) => r.excerpt.source)).toEqual([
      'category',
    ])
    expect(searchCards(entries, 'korean-i18n').map((r) => r.excerpt.source)).toEqual([
      'tag',
    ])

    const logMatches = searchCards(entries, 'retry')
    expect(logMatches).toHaveLength(1)
    expect(logMatches[0].projection.card.id).toBe('c-log')
    expect(logMatches[0].excerpt.source).toBe('workLog')
    expect(logMatches[0].excerpt.workLogCreatedAt).toBe('2026-09-08T10:00:00.000Z')
    expect(
      logMatches[0].excerpt.text.slice(
        logMatches[0].excerpt.matchStart,
        logMatches[0].excerpt.matchStart + logMatches[0].excerpt.matchLength,
      ),
    ).toBe('retry')

    expect(searchCards(entries, '한글 검색').map((r) => r.projection.card.id)).toEqual([
      'c-log',
    ])
    expect(searchCards(entries, '   ')).toEqual([])
  })

  it('combines all five filters using AND logic and handles due date variants', () => {
    const now = new Date('2026-09-08T12:00:00')
    const matchEntry = entryFixture({
      card: {
        id: 'match',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: '2026-09-07',
        categoryId: 'cat-1',
      },
      categoryId: 'cat-1',
      categoryName: 'Work',
      tagNames: ['urgent'],
    })
    matchEntry.projection.tags = [tagFixture({ id: 'tag-urgent', name: 'urgent' })]

    const doneOverdue = entryFixture({
      card: {
        id: 'done-overdue',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: '2026-09-07',
        categoryId: 'cat-1',
      },
      categoryId: 'cat-1',
      categoryName: 'Work',
    })
    doneOverdue.projection.tags = [tagFixture({ id: 'tag-urgent', name: 'urgent' })]

    const todayCard = entryFixture({
      card: { id: 'due-today', status: 'TODO', dueDate: '2026-09-08' },
    })
    const noDueCard = entryFixture({
      card: { id: 'no-due', status: 'TODO', dueDate: undefined },
    })
    const upcomingCard = entryFixture({
      card: { id: 'upcoming', status: 'TODO', dueDate: '2026-09-10' },
    })

    const combined: CardFilterState = {
      categoryId: 'cat-1',
      tagId: 'tag-urgent',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due: 'overdue',
    }

    const projections = [
      matchEntry.projection,
      doneOverdue.projection,
      todayCard.projection,
      noDueCard.projection,
      upcomingCard.projection,
    ]

    expect(
      filterCardProjections(projections, combined, now).map((p) => p.card.id),
    ).toEqual(['match'])

    expect(
      filterCardProjections(
        projections,
        { ...DEFAULT_CARD_FILTER_STATE, due: 'today' },
        now,
      ).map((p) => p.card.id),
    ).toEqual(['due-today'])

    expect(
      filterCardProjections(
        projections,
        { ...DEFAULT_CARD_FILTER_STATE, due: 'upcoming' },
        now,
      ).map((p) => p.card.id),
    ).toEqual(['upcoming'])

    expect(
      filterCardProjections(
        projections,
        { ...DEFAULT_CARD_FILTER_STATE, due: 'noDue' },
        now,
      ).map((p) => p.card.id),
    ).toEqual(['no-due'])

    expect(
      pruneDeletedClassificationFilters(
        combined,
        new Set(),
        new Set(['tag-urgent']),
      ),
    ).toEqual({
      ...combined,
      categoryId: null,
    })
  })

  it('sorts stably across all five sort modes including tie-breakers and search integration', () => {
    const e1 = entryFixture({
      card: {
        id: 'b-card',
        title: 'Task Beta',
        sortOrder: 1,
        priority: 'MEDIUM',
        updatedAt: '2026-09-08T05:00:00.000Z',
        createdAt: '2026-09-07T05:00:00.000Z',
        dueDate: undefined,
      },
    })
    const e2 = entryFixture({
      card: {
        id: 'a-card',
        title: 'Task Alpha',
        sortOrder: 0,
        priority: 'HIGH',
        updatedAt: '2026-09-08T01:00:00.000Z',
        createdAt: '2026-09-08T01:00:00.000Z',
        dueDate: '2026-09-12',
      },
    })
    const e3 = entryFixture({
      card: {
        id: 'c-card',
        title: 'Task Gamma',
        sortOrder: 2,
        priority: 'HIGH',
        updatedAt: '2026-09-08T01:00:00.000Z',
        createdAt: '2026-09-08T09:00:00.000Z',
        dueDate: '2026-09-09',
      },
    })

    const projections = [e1.projection, e2.projection, e3.projection]

    expect(sortCardProjections(projections, 'manual').map((p) => p.card.id)).toEqual([
      'a-card',
      'b-card',
      'c-card',
    ])
    expect(
      sortCardProjections(projections, 'recentlyUpdated').map((p) => p.card.id),
    ).toEqual(['b-card', 'a-card', 'c-card'])
    expect(
      sortCardProjections(projections, 'createdDate').map((p) => p.card.id),
    ).toEqual(['c-card', 'a-card', 'b-card'])
    expect(sortCardProjections(projections, 'dueDate').map((p) => p.card.id)).toEqual([
      'c-card',
      'a-card',
      'b-card',
    ])
    expect(sortCardProjections(projections, 'priority').map((p) => p.card.id)).toEqual([
      'a-card',
      'c-card',
      'b-card',
    ])

    expect(
      queryCardProjections([e1, e2, e3], {
        query: 'task',
        filters: DEFAULT_CARD_FILTER_STATE,
        sort: 'dueDate',
      }).map((p) => p.card.id),
    ).toEqual(['c-card', 'a-card', 'b-card'])
  })
})
