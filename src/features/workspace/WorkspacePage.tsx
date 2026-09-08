const viewCopy = {
  today: {
    title: 'Today',
    description: 'Due, updated, and completed work for the selected day.',
  },
  all: {
    title: 'All Tasks',
    description: 'Every active task, grouped by its current status.',
  },
  inProgress: {
    title: 'In Progress',
    description: 'Work that is actively moving forward.',
  },
  waiting: {
    title: 'Waiting',
    description: 'Work that needs an external response or dependency.',
  },
  completed: {
    title: 'Completed',
    description: 'Finished work and its recorded progress history.',
  },
} as const

export function WorkspacePage({ view }: { view: keyof typeof viewCopy }) {
  const copy = viewCopy[view]
  return (
    <section className="grid gap-4" aria-labelledby="workspace-title">
      <header className="grid gap-1 border-b pb-3">
        <h1 id="workspace-title" className="text-page-title font-semibold">
          {copy.title}
        </h1>
        <p className="text-ui text-muted-foreground">{copy.description}</p>
      </header>
      <div className="h-28 rounded-card border border-dashed bg-surface-subtle/60" />
    </section>
  )
}
