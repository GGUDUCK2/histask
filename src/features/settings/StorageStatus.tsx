import { useEffect, useMemo, useState } from 'react'
import { Database, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  StoragePersistenceService,
  type StoragePersistenceStatus,
} from '@/services/storage-status'

type ViewStatus = StoragePersistenceStatus | 'checking' | 'requesting'

const statusCopy: Record<ViewStatus, string> = {
  checking: 'Checking browser storage status…',
  requesting: 'Requesting persistent local storage…',
  persisted: 'This browser reports that Histask storage is persistent.',
  'not-persisted': 'Data is local, but the browser may reclaim its storage.',
  denied: 'The browser did not grant persistent storage.',
  unsupported: 'This browser does not report persistent storage status.',
  error: 'Could not read the browser storage status.',
}

export function StorageStatus({
  service,
}: {
  service?: StoragePersistenceService
}) {
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
        <div className="font-medium">Browser storage</div>
        <p className="mt-0.5 text-metadata text-muted-foreground" role="status">
          {statusCopy[status]}
        </p>
        <p className="mt-1 text-metadata text-muted-foreground">
          Data stays in this browser profile and origin. Persistence does not
          guarantee permanent retention.
        </p>
      </div>
      {canRequest && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void requestPersistence()}
        >
          Request persistence
        </Button>
      )}
    </div>
  )
}
