import type { ComponentType } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Tags,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { MiniCalendar } from '@/features/calendar/MiniCalendar'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { getClassificationMeta } from '@/utils/classification-styles'
import { cn } from '@/utils/cn'

const navigation: Array<{
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
}> = [
  { label: 'Today', path: '/today', icon: CalendarDays },
  { label: 'All Tasks', path: '/all', icon: ListTodo },
  { label: 'In Progress', path: '/in-progress', icon: CircleDot },
  { label: 'Waiting', path: '/waiting', icon: Clock3 },
  { label: 'Completed', path: '/completed', icon: CheckCircle2 },
]

const TASK_FILTER_ROUTES = new Set([
  '/all',
  '/in-progress',
  '/waiting',
  '/completed',
])

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const {
    snapshot,
    filters,
    setFilters,
    openClassificationDialog,
  } = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()

  function ensureTaskListRoute() {
    if (!TASK_FILTER_ROUTES.has(location.pathname)) {
      navigate('/all')
    }
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col bg-surface-subtle">
      <nav aria-label="Primary" className="grid gap-1 p-3">
        {navigation.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-8 items-center gap-2 rounded-control px-2.5 text-ui font-medium text-secondary-foreground hover:bg-surface-hover',
                isActive && 'bg-accent text-accent-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 border-t" />

      <div className="grid gap-4 overflow-y-auto p-3">
        <MiniCalendar onNavigate={onNavigate} />

        <section aria-labelledby="categories-slot-title" className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <h2
              id="categories-slot-title"
              className="text-metadata font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Categories
            </h2>
            <button
              type="button"
              aria-label="New category"
              onClick={(event) =>
                openClassificationDialog(
                  { kind: 'category', mode: 'create' },
                  event.currentTarget,
                )
              }
              className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {snapshot.categories.length === 0 ? (
            <p className="px-1 text-metadata text-muted-foreground">
              No categories yet
            </p>
          ) : (
            <div className="grid gap-0.5">
              {snapshot.categories.map((category) => {
                const selected = filters.categoryId === category.id
                const count = snapshot.categoryCardCounts.get(category.id) ?? 0
                const meta = getClassificationMeta(category.color)
                return (
                  <div
                    key={category.id}
                    className="group flex items-center gap-1"
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${category.name} (${count} ${count === 1 ? 'task' : 'tasks'})`}
                      onClick={() => {
                        setFilters((previous) => ({
                          ...previous,
                          categoryId:
                            previous.categoryId === category.id
                              ? null
                              : category.id,
                        }))
                        ensureTaskListRoute()
                      }}
                      className={cn(
                        'flex h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-control px-2 text-ui transition-colors',
                        selected
                          ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                          : 'text-secondary-foreground hover:bg-surface-hover',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'size-2 shrink-0 rounded-full',
                            meta.dotClass,
                          )}
                        />
                        <span className="truncate">{category.name}</span>
                      </span>
                      <span className="shrink-0 text-metadata text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit category ${category.name}`}
                      onClick={(event) =>
                        openClassificationDialog(
                          {
                            kind: 'category',
                            mode: 'edit',
                            itemId: category.id,
                          },
                          event.currentTarget,
                        )
                      }
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-control text-muted-foreground opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="tags-slot-title" className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Tags className="size-3.5 text-muted-foreground" />
              <h2
                id="tags-slot-title"
                className="text-metadata font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Tags
              </h2>
            </div>
            <button
              type="button"
              aria-label="New tag"
              onClick={(event) =>
                openClassificationDialog(
                  { kind: 'tag', mode: 'create' },
                  event.currentTarget,
                )
              }
              className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {snapshot.tags.length === 0 ? (
            <p className="px-1 text-metadata text-muted-foreground">
              No tags yet
            </p>
          ) : (
            <div className="grid gap-0.5">
              {snapshot.tags.map((tag) => {
                const selected = filters.tagId === tag.id
                const count = snapshot.tagCardCounts.get(tag.id) ?? 0
                const meta = getClassificationMeta(tag.color)
                return (
                  <div key={tag.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${tag.name} (${count} ${count === 1 ? 'task' : 'tasks'})`}
                      onClick={() => {
                        setFilters((previous) => ({
                          ...previous,
                          tagId: previous.tagId === tag.id ? null : tag.id,
                        }))
                        ensureTaskListRoute()
                      }}
                      className={cn(
                        'flex h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-control px-2 text-ui transition-colors',
                        selected
                          ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                          : 'text-secondary-foreground hover:bg-surface-hover',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'size-2 shrink-0 rounded-full',
                            meta.dotClass,
                          )}
                        />
                        <span className="truncate">{tag.name}</span>
                      </span>
                      <span className="shrink-0 text-metadata text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit tag ${tag.name}`}
                      onClick={(event) =>
                        openClassificationDialog(
                          { kind: 'tag', mode: 'edit', itemId: tag.id },
                          event.currentTarget,
                        )
                      }
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-control text-muted-foreground opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
