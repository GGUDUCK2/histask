import { useCallback, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import type { HistaskDatabase } from '@/db/database'
import { DATABASE_SCHEMA_VERSION } from '@/db/schema'
import { BackupExportService, BackupImportService } from '@/services/backup'
import { DeleteAllDataService } from '@/services/delete-all-data'
import { BackupControls } from './BackupControls'
import { DeleteAllDataDialog } from './DeleteAllDataDialog'
import { StorageStatus } from './StorageStatus'
import { ThemeSettings } from './ThemeSettings'
import type { RunDataMutation } from './types'

export function SettingsPage({ database }: { database: HistaskDatabase }) {
  const services = useMemo(
    () => ({
      backupExport: new BackupExportService(database),
      backupImport: new BackupImportService(database),
      deleteAll: new DeleteAllDataService(database),
    }),
    [database],
  )
  const mutationLocked = useRef(false)
  const [writePending, setWritePending] = useState(false)
  const runMutation = useCallback<RunDataMutation>(async (operation) => {
    if (mutationLocked.current) return false
    mutationLocked.current = true
    setWritePending(true)
    try {
      await operation()
      return true
    } finally {
      mutationLocked.current = false
      setWritePending(false)
    }
  }, [])

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <header className="grid gap-1 border-b pb-3">
        <h1 id="settings-title" className="text-page-title font-semibold">
          Settings
        </h1>
        <p className="text-ui text-muted-foreground">
          Storage, backups, appearance, and local application details.
        </p>
      </header>

      <section className="settings-section" aria-labelledby="data-title">
        <h2 id="data-title">Data</h2>
        <div className="settings-panel">
          <StorageStatus />
          <div className="border-t">
            <BackupControls
              exportService={services.backupExport}
              importService={services.backupImport}
              runMutation={runMutation}
              writePending={writePending}
            />
          </div>
          <div className="border-t">
            <DeleteAllDataDialog
              runMutation={runMutation}
              service={services.deleteAll}
              writePending={writePending}
            />
          </div>
        </div>
      </section>

      <section
        className="settings-section"
        aria-labelledby="application-title"
      >
        <h2 id="application-title">Application</h2>
        <div className="settings-panel">
          <ThemeSettings />
        </div>
      </section>

      <section className="settings-section" aria-labelledby="about-title">
        <h2 id="about-title">About</h2>
        <div className="settings-panel">
          <div className="settings-row items-start">
            <Info className="mt-0.5 size-4 text-muted-foreground" />
            <dl className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-ui">
              <dt className="text-muted-foreground">Histask version</dt>
              <dd className="font-medium tabular-nums">
                {import.meta.env.VITE_APP_VERSION || '0.0.0'}
              </dd>
              <dt className="text-muted-foreground">Storage</dt>
              <dd className="font-medium">IndexedDB</dd>
              <dt className="text-muted-foreground">Database schema</dt>
              <dd className="font-medium tabular-nums">
                {DATABASE_SCHEMA_VERSION}
              </dd>
            </dl>
          </div>
        </div>
      </section>
    </section>
  )
}
