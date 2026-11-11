import { ArrowUpDown, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkspace } from '@/features/workspace/workspace-context'
import {
  CARD_SORT_LABELS,
  CARD_SORT_MODES,
  DUE_DATE_FILTER_LABELS,
  type CardSortMode,
  type DueDateFilter,
} from '@/types/card-query'
import {
  CARD_STATUSES,
  CARD_STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  type CardStatus,
  type Priority,
} from '@/types/domain'

const ALL_VALUE = '__all__'
const DUE_FILTERS: readonly DueDateFilter[] = [
  'all',
  'overdue',
  'today',
  'upcoming',
  'noDue',
]

export function FilterSortBar({
  hideStatusFilter = false,
}: {
  hideStatusFilter?: boolean
}) {
  const {
    snapshot,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortMode,
    setSortMode,
    hasAnyFilterOrSearch,
    clearFiltersAndSearch,
  } = useWorkspace()

  const activeCategory = snapshot.categories.find(
    (category) => category.id === filters.categoryId,
  )
  const activeTag = snapshot.tags.find((tag) => tag.id === filters.tagId)

  return (
    <section
      aria-label="Filter and sort tasks"
      className="grid gap-2 rounded-card border bg-surface px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[140px] flex-1 sm:max-w-[170px]">
          <Select
            value={filters.categoryId ?? ALL_VALUE}
            onValueChange={(value) =>
              setFilters((previous) => ({
                ...previous,
                categoryId: value === ALL_VALUE ? null : value,
              }))
            }
          >
            <SelectTrigger aria-label="Filter by category" className="h-control-sm text-ui">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All categories</SelectItem>
              {snapshot.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px] flex-1 sm:max-w-[160px]">
          <Select
            value={filters.tagId ?? ALL_VALUE}
            onValueChange={(value) =>
              setFilters((previous) => ({
                ...previous,
                tagId: value === ALL_VALUE ? null : value,
              }))
            }
          >
            <SelectTrigger aria-label="Filter by tag" className="h-control-sm text-ui">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All tags</SelectItem>
              {snapshot.tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!hideStatusFilter && (
          <div className="min-w-[130px] flex-1 sm:max-w-[155px]">
            <Select
              value={filters.status ?? ALL_VALUE}
              onValueChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  status: value === ALL_VALUE ? null : (value as CardStatus),
                }))
              }
            >
              <SelectTrigger aria-label="Filter by status" className="h-control-sm text-ui">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                {CARD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {CARD_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="min-w-[125px] flex-1 sm:max-w-[150px]">
          <Select
            value={filters.priority ?? ALL_VALUE}
            onValueChange={(value) =>
              setFilters((previous) => ({
                ...previous,
                priority: value === ALL_VALUE ? null : (value as Priority),
              }))
            }
          >
            <SelectTrigger aria-label="Filter by priority" className="h-control-sm text-ui">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All priorities</SelectItem>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px] flex-1 sm:max-w-[160px]">
          <Select
            value={filters.due}
            onValueChange={(value) =>
              setFilters((previous) => ({
                ...previous,
                due: value as DueDateFilter,
              }))
            }
          >
            <SelectTrigger aria-label="Filter by due date" className="h-control-sm text-ui">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DUE_FILTERS.map((due) => (
                <SelectItem key={due} value={due}>
                  {DUE_DATE_FILTER_LABELS[due]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground"
          />
          <Select
            value={sortMode}
            onValueChange={(value) => setSortMode(value as CardSortMode)}
          >
            <SelectTrigger
              aria-label="Sort tasks"
              className="h-control-sm w-[155px] text-ui"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_SORT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {CARD_SORT_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasAnyFilterOrSearch && (
        <div className="flex flex-wrap items-center gap-1.5 border-t pt-2 text-metadata">
          <span className="text-muted-foreground">Active:</span>

          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 rounded-tag border bg-surface-subtle px-2 py-0.5 text-foreground hover:bg-surface-hover"
            >
              <span>Search: {searchQuery.trim()}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}

          {activeCategory && (
            <button
              type="button"
              onClick={() =>
                setFilters((previous) => ({ ...previous, categoryId: null }))
              }
              className="inline-flex items-center gap-1 rounded-tag border bg-surface-subtle px-2 py-0.5 text-foreground hover:bg-surface-hover"
            >
              <span>Category: {activeCategory.name}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}

          {activeTag && (
            <button
              type="button"
              onClick={() =>
                setFilters((previous) => ({ ...previous, tagId: null }))
              }
              className="inline-flex items-center gap-1 rounded-tag border bg-surface-subtle px-2 py-0.5 text-foreground hover:bg-surface-hover"
            >
              <span>Tag: {activeTag.name}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}

          {!hideStatusFilter && filters.status && (
            <button
              type="button"
              onClick={() =>
                setFilters((previous) => ({ ...previous, status: null }))
              }
              className="inline-flex items-center gap-1 rounded-tag border bg-surface-subtle px-2 py-0.5 text-foreground hover:bg-surface-hover"
            >
              <span>Status: {CARD_STATUS_LABELS[filters.status]}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}

          {filters.priority && (
            <button
              type="button"
              onClick={() =>
                setFilters((previous) => ({ ...previous, priority: null }))
              }
              className="inline-flex items-center gap-1 rounded-tag border bg-surface-subtle px-2 py-0.5 text-foreground hover:bg-surface-hover"
            >
              <span>Priority: {PRIORITY_LABELS[filters.priority]}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}

          {filters.due !== 'all' && (
            <button
              type="button"
              onClick={() =>
                setFilters((previous) => ({ ...previous, due: 'all' }))
              }
              className="inline-flex items-center gap-1 rounded-tag border bg-surface-subtle px-2 py-0.5 text-foreground hover:bg-surface-hover"
            >
              <span>Due: {DUE_DATE_FILTER_LABELS[filters.due]}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFiltersAndSearch}
            className="ml-auto h-6 px-2 text-metadata"
          >
            <RotateCcw className="size-3" />
            Clear all
          </Button>
        </div>
      )}
    </section>
  )
}
