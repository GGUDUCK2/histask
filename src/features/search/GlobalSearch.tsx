import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { SEARCH_SOURCE_LABELS, type CardSearchResult } from '@/types/card-query'
import { CARD_STATUS_LABELS } from '@/types/domain'
import { getClassificationMeta } from '@/utils/classification-styles'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/dates'
import { isReactImeComposing } from '@/utils/keyboard'

function HighlightedSnippet({
  text,
  matchStart,
  matchLength,
}: {
  text: string
  matchStart: number
  matchLength: number
}) {
  if (matchLength <= 0 || matchStart < 0 || matchStart >= text.length) {
    return <span>{text}</span>
  }
  const before = text.slice(0, matchStart)
  const match = text.slice(matchStart, matchStart + matchLength)
  const after = text.slice(matchStart + matchLength)

  return (
    <span>
      {before}
      <mark className="rounded-xs bg-[var(--accent-soft)] px-0.5 font-medium text-foreground">
        {match}
      </mark>
      {after}
    </span>
  )
}

export function GlobalSearch() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchInputRef,
    searchDropdownOpen,
    setSearchDropdownOpen,
    openCard,
  } = useWorkspace()

  const containerRef = useRef<HTMLDivElement>(null)
  const lastCompositionEndAtRef = useRef(0)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const listboxId = useId()

  const visibleResults: readonly CardSearchResult[] = searchResults.slice(0, 10)
  const showResults = searchDropdownOpen && searchQuery.trim().length > 0
  const safeHighlightedIndex =
    visibleResults.length === 0
      ? 0
      : Math.min(highlightedIndex, visibleResults.length - 1)

  useEffect(() => {
    if (!showResults) return
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setSearchDropdownOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [setSearchDropdownOpen, showResults])

  function handleSelectResult(result: CardSearchResult) {
    setSearchDropdownOpen(false)
    openCard(result.projection.card.id, searchInputRef.current)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (isReactImeComposing(event, lastCompositionEndAtRef.current)) return

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (showResults) {
        setSearchDropdownOpen(false)
      } else if (searchQuery) {
        setSearchQuery('')
      } else {
        searchInputRef.current?.blur()
      }
      return
    }

    if (!showResults || visibleResults.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((previous) => (previous + 1) % visibleResults.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex(
        (previous) =>
          (previous - 1 + visibleResults.length) % visibleResults.length,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const selected =
        visibleResults[safeHighlightedIndex] ?? visibleResults[0]
      if (selected) handleSelectResult(selected)
    }
  }

  const activeDescendantId =
    showResults && visibleResults[safeHighlightedIndex]
      ? `${listboxId}-option-${visibleResults[safeHighlightedIndex].projection.card.id}`
      : undefined

  return (
    <div ref={containerRef} className="relative w-[170px] sm:w-[240px] md:w-[270px]">
      <div role="search">
        <div className="relative flex items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground"
          />
          <Input
            ref={searchInputRef}
            type="search"
            role="combobox"
            aria-label="Search tasks"
            aria-expanded={showResults}
            aria-controls={listboxId}
            aria-activedescendant={activeDescendantId}
            aria-autocomplete="list"
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim()) setSearchDropdownOpen(true)
            }}
            onChange={(event) => {
              setHighlightedIndex(0)
              setSearchQuery(event.target.value)
              setSearchDropdownOpen(event.target.value.trim().length > 0)
            }}
            onCompositionEnd={(event) => {
              lastCompositionEndAtRef.current = event.timeStamp
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks... (/)"
            className="h-control-sm pl-8 pr-7 text-ui"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setHighlightedIndex(0)
                setSearchQuery('')
                setSearchDropdownOpen(false)
                searchInputRef.current?.focus()
              }}
              className="absolute right-1.5 inline-flex size-5 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Matching tasks"
          className="absolute right-0 top-[calc(100%+6px)] z-50 max-h-[min(24rem,calc(100svh-5rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-card border bg-popover p-1.5 text-popover-foreground shadow-overlay ui-fade"
        >
          {visibleResults.length === 0 ? (
            <div className="px-3 py-4 text-center text-ui text-muted-foreground">
              No matching tasks for &ldquo;{searchQuery.trim()}&rdquo;
            </div>
          ) : (
            <div className="grid gap-1">
              {visibleResults.map((result, index) => {
                const { projection, excerpt } = result
                const { card, category, tags } = projection
                const isActive = index === safeHighlightedIndex
                return (
                  <button
                    key={card.id}
                    id={`${listboxId}-option-${card.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectResult(result)}
                    className={cn(
                      'grid gap-1 rounded-control px-2.5 py-2 text-left transition-colors',
                      isActive ? 'bg-surface-hover' : 'hover:bg-surface-hover',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-card-title text-foreground">
                        {excerpt.source === 'title' ? (
                          <HighlightedSnippet
                            text={excerpt.text}
                            matchStart={excerpt.matchStart}
                            matchLength={excerpt.matchLength}
                          />
                        ) : (
                          card.title
                        )}
                      </span>
                      <span className="shrink-0 rounded-tag border bg-surface px-1.5 py-0 text-tag text-muted-foreground">
                        {CARD_STATUS_LABELS[card.status]}
                      </span>
                    </div>

                    {excerpt.source !== 'title' && (
                      <p className="line-clamp-2 text-metadata text-muted-foreground break-words">
                        <span className="mr-1 font-medium text-secondary-foreground">
                          {SEARCH_SOURCE_LABELS[excerpt.source]}
                          {excerpt.workLogCreatedAt
                            ? ` (${formatRelativeTime(excerpt.workLogCreatedAt)})`
                            : ''}
                          :
                        </span>
                        <HighlightedSnippet
                          text={excerpt.text}
                          matchStart={excerpt.matchStart}
                          matchLength={excerpt.matchLength}
                        />
                      </p>
                    )}

                    {(category || tags.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-tag text-muted-foreground">
                        {category && (
                          <span className="inline-flex items-center gap-1">
                            <span
                              aria-hidden="true"
                              className={cn(
                                'size-1.5 rounded-full',
                                getClassificationMeta(category.color).dotClass,
                              )}
                            />
                            {category.name}
                          </span>
                        )}
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className={cn(
                              'rounded-tag border px-1 py-0',
                              getClassificationMeta(tag.color).chipClass,
                            )}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
              {searchResults.length > visibleResults.length && (
                <p className="border-t px-2.5 py-1.5 text-metadata text-muted-foreground">
                  Showing {visibleResults.length} of {searchResults.length}{' '}
                  matches. Board cards are filtered in place.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
