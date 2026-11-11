import { AlertCircle } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { cn } from '@/utils/cn'

export function MetricsRow() {
  const { messages } = useI18n()
  const { metrics, metricsStatus, hasAnyFilterOrSearch } = useWorkspace()

  if (metricsStatus === 'error') {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-card border border-[var(--danger)]/30 bg-[var(--danger)]/8 px-3 py-2 text-ui text-[var(--danger)]"
      >
        <AlertCircle className="size-4 shrink-0" />
        <span>{messages.dashboard.loadError}</span>
      </div>
    )
  }

  const metricItems: Array<{
    key: 'total' | 'inProgress' | 'waiting' | 'done' | 'updatedToday'
    label: string
    hint?: string
    accent?: string
  }> = [
    {
      key: 'total',
      label: messages.dashboard.metrics.total,
      hint: messages.dashboard.metrics.totalHint,
    },
    {
      key: 'inProgress',
      label: messages.dashboard.metrics.inProgress,
      accent: 'text-[var(--accent)]',
    },
    {
      key: 'waiting',
      label: messages.dashboard.metrics.waiting,
      accent: 'text-[var(--warning)]',
    },
    {
      key: 'done',
      label: messages.dashboard.metrics.done,
      accent: 'text-[var(--success)]',
    },
    {
      key: 'updatedToday',
      label: messages.dashboard.metrics.updatedToday,
      hint: messages.dashboard.metrics.updatedTodayHint,
    },
  ]

  return (
    <section
      aria-label={messages.dashboard.regionLabel}
      className="grid gap-1.5"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {metricItems.map(({ key, label, hint, accent }) => (
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
          {messages.dashboard.filterDisclaimer}
        </p>
      )}
    </section>
  )
}
