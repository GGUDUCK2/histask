import { useI18n } from '@/app/language-context'
import type { WorkLog } from '@/types/domain'
import { WorkLogEntry } from './WorkLogEntry'

export function WorkLogTimeline({ workLogs }: { workLogs: readonly WorkLog[] }) {
  const { messages } = useI18n()

  if (workLogs.length === 0) {
    return (
      <div className="rounded-card border border-dashed bg-surface-subtle/50 px-3 py-4 text-center text-ui text-muted-foreground">
        {messages.workLog.emptyTimeline}
      </div>
    )
  }

  return (
    <ol aria-label={messages.workLog.timelineAria} className="grid">
      {workLogs.map((log, index) => (
        <WorkLogEntry key={log.id} workLog={log} isLatest={index === 0} />
      ))}
    </ol>
  )
}
