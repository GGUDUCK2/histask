import { useEffect, useMemo, useState } from 'react'
import { Database, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import {
  StoragePersistenceService,
  type StoragePersistenceStatus,
} from '@/services/storage-status'

type ViewStatus = StoragePersistenceStatus | 'checking' | 'requesting'

export function StorageStatus({
  service,
}: {
  service?: StoragePersistenceService
}) {
  const { messages } = useI18n()
  const persistence = useMemo(
    () => service ?? new StoragePersistenceService(),
    [service],
  )
  const [status, setStatus] = useState<ViewStatus>('checking')

  useEffect(() => {
    let active = true
    void persistence.check().then((result) => {
      if (active) setStatus(result)
    })
    return () => {
      active = false
    }
  }, [persistence])

  const requestPersistence = async () => {
    setStatus('requesting')
    setStatus(await persistence.request())
  }

  const canRequest =
    status === 'not-persisted' || status === 'denied' || status === 'error'

  return (
    <div className="settings-row items-start">
      <div className="mt-0.5 text-muted-foreground">
        {status === 'persisted' ? (
          <ShieldCheck className="size-4 text-success" />
        ) : (
          <Database className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{messages.settings.storageTitle}</div>
        <p className="mt-0.5 text-metadata text-muted-foreground" role="status">
          {messages.settings.storageStatuses[status]}
        </p>
        <p className="mt-1 text-metadata text-muted-foreground">
          {messages.settings.storageRetentionNote}
        </p>
      </div>
      {canRequest && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void requestPersistence()}
        >
          {messages.settings.storageRequestButton}
        </Button>
      )}
    </div>
  )
}
