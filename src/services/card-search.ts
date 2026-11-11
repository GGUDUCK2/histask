import type { WorkspaceSnapshot } from './board-query'
import type {
  CardSearchEntry,
  CardSearchResult,
  SearchMatchExcerpt,
  SearchMatchSource,
} from '@/types/card-query'

function normalizeForExcerpt(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function buildExcerpt(
  source: SearchMatchSource,
  rawText: string,
  normalizedQuery: string,
  workLogCreatedAt?: string,
): SearchMatchExcerpt | null {
  const normalized = normalizeForExcerpt(rawText)
  if (!normalized) return null

  const lower = normalized.toLocaleLowerCase()
  const matchIndex = lower.indexOf(normalizedQuery)
  if (matchIndex === -1) return null

  const lead = 32
  const tail = 64
  const start = Math.max(0, matchIndex - lead)
  const end = Math.min(normalized.length, matchIndex + normalizedQuery.length + tail)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < normalized.length ? '…' : ''
  const snippet = `${prefix}${normalized.slice(start, end)}${suffix}`
  const matchStart = prefix.length + (matchIndex - start)
  const matchLength = Math.min(normalizedQuery.length, snippet.length - matchStart)

  return {
    source,
    text: snippet,
    matchStart,
    matchLength,
    ...(workLogCreatedAt ? { workLogCreatedAt } : {}),
  }
}

export function normalizeSearchQuery(rawQuery: string): string {
  return normalizeForExcerpt(rawQuery).toLocaleLowerCase()
}

export function matchCardSearch(
  entry: CardSearchEntry,
  normalizedQuery: string,
): CardSearchResult | null {
  if (!normalizedQuery) return null

  const { projection, workLogs } = entry
  const { card, category, tags } = projection
  if (card.archivedAt !== undefined) return null

  const matchedSources: SearchMatchSource[] = []
  let titleExcerpt: SearchMatchExcerpt | null = null
  let descriptionExcerpt: SearchMatchExcerpt | null = null
  let categoryExcerpt: SearchMatchExcerpt | null = null
  let tagExcerpt: SearchMatchExcerpt | null = null
  let workLogExcerpt: SearchMatchExcerpt | null = null

  titleExcerpt = buildExcerpt('title', card.title, normalizedQuery)
  if (titleExcerpt) matchedSources.push('title')

  if (card.description) {
    descriptionExcerpt = buildExcerpt(
      'description',
      card.description,
      normalizedQuery,
    )
    if (descriptionExcerpt) matchedSources.push('description')
  }

  if (category) {
    categoryExcerpt = buildExcerpt('category', category.name, normalizedQuery)
    if (categoryExcerpt) matchedSources.push('category')
  }

  for (const tag of tags) {
    const candidate = buildExcerpt('tag', tag.name, normalizedQuery)
    if (candidate) {
      if (!tagExcerpt) {
        tagExcerpt = candidate
        matchedSources.push('tag')
      }
      break
    }
  }

  // workLogs are newest-first; only surface the first/newest matching log per Card.
  for (const log of workLogs) {
    const candidate = buildExcerpt(
      'workLog',
      log.content,
      normalizedQuery,
      log.createdAt,
    )
    if (candidate) {
      workLogExcerpt = candidate
      matchedSources.push('workLog')
      break
    }
  }

  const excerpt =
    workLogExcerpt ??
    descriptionExcerpt ??
    categoryExcerpt ??
    tagExcerpt ??
    titleExcerpt

  if (!excerpt) return null

  return {
    projection,
    matchedSources,
    excerpt,
  }
}

export function buildCardSearchEntries(
  snapshot: Pick<WorkspaceSnapshot, 'cards' | 'workLogsByCard'>,
): CardSearchEntry[] {
  return snapshot.cards.map((projection) => ({
    projection,
    workLogs: snapshot.workLogsByCard.get(projection.card.id) ?? [],
  }))
}

export function searchCards(
  entries: readonly CardSearchEntry[],
  rawQuery: string,
): CardSearchResult[] {
  const normalizedQuery = normalizeSearchQuery(rawQuery)
  if (!normalizedQuery) return []

  const results: CardSearchResult[] = []
  for (const entry of entries) {
    const match = matchCardSearch(entry, normalizedQuery)
    if (match) results.push(match)
  }
  return results
}
