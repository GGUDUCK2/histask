import type { ComponentType } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  ListTodo,
  Tags,
} from 'lucide-react'
import { NavLink } from 'react-router'
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

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

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
        <section aria-labelledby="calendar-slot-title" className="grid gap-2">
          <div className="flex items-center justify-between">
            <h2
              id="calendar-slot-title"
              className="text-ui font-semibold text-foreground"
            >
              Mini Calendar
            </h2>
            <span className="text-metadata text-muted-foreground">
              {monthLabel}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-20 rounded-card border bg-surface/60"
          />
        </section>

        <section aria-labelledby="categories-slot-title" className="grid gap-2">
          <h2
            id="categories-slot-title"
            className="text-ui font-semibold text-foreground"
          >
            Categories
          </h2>
          <div className="h-px bg-border" aria-hidden="true" />
        </section>

        <section aria-labelledby="tags-slot-title" className="grid gap-2">
          <div className="flex items-center gap-2">
            <Tags className="size-3.5 text-muted-foreground" />
            <h2
              id="tags-slot-title"
              className="text-ui font-semibold text-foreground"
            >
              Tags
            </h2>
          </div>
          <div className="h-px bg-border" aria-hidden="true" />
        </section>
      </div>
    </div>
  )
}
