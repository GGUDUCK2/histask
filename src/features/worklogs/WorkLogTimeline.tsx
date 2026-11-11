import type { WorkLog } from '@/types/domain'
import { WorkLogEntry } from './WorkLogEntry'

export function WorkLogTimeline({ workLogs }: { workLogs: readonly WorkLog[] }) {
  if (workLogs.length === 0) {
    return (
      <div className="rounded-card border border-dashed bg-surface-subtle/50 px-3 py-4 text-center text-ui text-muted-foreground">
        No progress history yet. Add the first WorkLog above so you can track
        updates directly from the board.
      </div>
    )
  }

  return (
    <ol aria-label="WorkLog history" className="grid">
      {workLogs.map((log, index) => (
        <WorkLogEntry key={log.id} workLog={log} isLatest={index === 0} />
      ))}
    </ol>
  )
}
