import { AlertCircle } from 'lucide-react'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { cn } from '@/utils/cn'

interface MetricItem {
  key: 'total' | 'inProgress' | 'waiting' | 'done' | 'updatedToday'
  label: string
  hint?: string
  accent?: string
}

const METRIC_ITEMS: readonly MetricItem[] = [
  { key: 'total', label: 'Total', hint: 'All active tasks' },
  {
    key: 'inProgress',
    label: 'In Progress',
    accent: 'text-[var(--accent)]',
  },
  {
    key: 'waiting',
    label: 'Waiting',
    accent: 'text-[var(--warning)]',
  },
  {
    key: 'done',
    label: 'Done',
    accent: 'text-[var(--success)]',
  },
  {
    key: 'updatedToday',
    label: 'Updated Today',
    hint: 'Unique cards with WorkLogs today',
  },
]

export function MetricsRow() {
  const { metrics, metricsStatus, hasAnyFilterOrSearch } = useWorkspace()

  if (metricsStatus === 'error') {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-card border border-[var(--danger)]/30 bg-[var(--danger)]/8 px-3 py-2 text-ui text-[var(--danger)]"
      >
        <AlertCircle className="size-4 shrink-0" />
        <span>Could not load task metrics from local storage.</span>
      </div>
    )
  }

  return (
    <section aria-label="Workspace metrics" className="grid gap-1.5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {METRIC_ITEMS.map(({ key, label, hint, accent }) => (
          <div
            key={key}
            title={hint}
            className="flex min-h-[56px] flex-col justify-center rounded-card border bg-surface px-3 py-2"
          >
            <span className="truncate text-metadata font-medium text-muted-foreground">
              {label}
            </span>
            <span
              className={cn(
                'text-metric tabular-nums',
                metricsStatus === 'loading'
                  ? 'text-muted-foreground'
                  : (accent ?? 'text-foreground'),
              )}
              data-testid={`metric-${key}`}
            >
              {metricsStatus === 'loading' ? '—' : metrics[key]}
            </span>
          </div>
        ))}
      </div>
      {hasAnyFilterOrSearch && (
        <p className="text-metadata text-muted-foreground">
          Metrics reflect all active tasks regardless of board search or
          filters.
        </p>
      )}
    </section>
  )
}
