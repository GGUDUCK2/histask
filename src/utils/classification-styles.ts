import type {
  CardStatus,
  ClassificationColor,
  Priority,
} from '@/types/domain'
import type { DueUrgency } from '@/utils/dates'

export const CLASSIFICATION_COLOR_META: Record<
  ClassificationColor,
  {
    label: string
    dotClass: string
    chipClass: string
  }
> = {
  slate: {
    label: 'Slate',
    dotClass: 'bg-slate-500',
    chipClass:
      'border-slate-500/25 bg-slate-500/8 text-slate-700 dark:text-slate-300',
  },
  indigo: {
    label: 'Indigo',
    dotClass: 'bg-indigo-500',
    chipClass:
      'border-indigo-500/25 bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
  },
  blue: {
    label: 'Blue',
    dotClass: 'bg-blue-500',
    chipClass:
      'border-blue-500/25 bg-blue-500/8 text-blue-700 dark:text-blue-300',
  },
  teal: {
    label: 'Teal',
    dotClass: 'bg-teal-500',
    chipClass:
      'border-teal-500/25 bg-teal-500/8 text-teal-700 dark:text-teal-300',
  },
  amber: {
    label: 'Amber',
    dotClass: 'bg-amber-500',
    chipClass:
      'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  rose: {
    label: 'Rose',
    dotClass: 'bg-rose-500',
    chipClass:
      'border-rose-500/25 bg-rose-500/8 text-rose-700 dark:text-rose-300',
  },
}

export function getClassificationMeta(color?: ClassificationColor) {
  return color
    ? CLASSIFICATION_COLOR_META[color]
    : CLASSIFICATION_COLOR_META.slate
}

export const CARD_STATUS_VISUAL: Record<
  CardStatus,
  {
    dotClass: string
    badgeClass: string
  }
> = {
  TODO: {
    dotClass: 'bg-[var(--text-muted)]',
    badgeClass: 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  },
  IN_PROGRESS: {
    dotClass: 'bg-[var(--accent)]',
    badgeClass: 'border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)]',
  },
  WAITING: {
    dotClass: 'bg-[var(--warning)]',
    badgeClass: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]',
  },
  DONE: {
    dotClass: 'bg-[var(--success)]',
    badgeClass: 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]',
  },
}

export const PRIORITY_VISUAL: Record<Priority, { badgeClass: string }> = {
  NONE: {
    badgeClass: 'text-[var(--text-muted)] border-transparent',
  },
  LOW: {
    badgeClass:
      'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  },
  MEDIUM: {
    badgeClass:
      'border-[var(--warning)]/25 bg-[var(--warning)]/8 text-[var(--warning)]',
  },
  HIGH: {
    badgeClass:
      'border-[var(--danger)]/30 bg-[var(--danger)]/8 text-[var(--danger)]',
  },
}

export const DUE_URGENCY_VISUAL: Record<DueUrgency, string> = {
  none: 'text-[var(--text-muted)]',
  future: 'text-[var(--text-secondary)]',
  today: 'text-[var(--warning)] font-medium',
  overdue: 'text-[var(--danger)] font-medium',
  completed: 'text-[var(--text-muted)]',
}
