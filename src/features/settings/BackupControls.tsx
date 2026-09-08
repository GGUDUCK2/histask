import { useRef, useState } from 'react'
import { Download, FileCheck2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BackupExportService,
  BackupImportService,
  BackupValidationError,
  parseBackupJson,
  prepareBackup,
  type PreparedBackup,
} from '@/services/backup'
import { ImportBackupDialog } from './ImportBackupDialog'
import type { RunDataMutation } from './types'

function downloadJson(json: string, filename: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([json], { type: mimeType }))
  const anchor = document.createElement('a')
  try {
    anchor.href = url
    anchor.download = filename
    anchor.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function BackupControls({
  exportService,
  importService,
  runMutation,
  writePending,
}: {
  exportService: BackupExportService
  importService: BackupImportService
  runMutation: RunDataMutation
  writePending: boolean
}) {
  const [exporting, setExporting] = useState(false)
  const [reading, setReading] = useState(false)
  const [prepared, setPrepared] = useState<PreparedBackup>()
  const [selectedFileName, setSelectedFileName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  const reviewButton = useRef<HTMLButtonElement>(null)
  const selectionVersion = useRef(0)
  const exportLock = useRef(false)

  const exportBackup = async () => {
    if (exportLock.current) return
    exportLock.current = true
    setExporting(true)
    setMessage(undefined)
    setError(undefined)
    try {
      const backup = await exportService.export()
      downloadJson(backup.json, backup.filename, backup.mimeType)
      setMessage(`Saved ${backup.filename} locally.`)
    } catch {
      setError('Could not export this backup. Your local data is unchanged.')
    } finally {
      exportLock.current = false
      setExporting(false)
    }
  }

  const readBackup = async (file: File | undefined) => {
    const version = selectionVersion.current + 1
    selectionVersion.current = version
    setPrepared(undefined)
    setSelectedFileName('')
    setDialogOpen(false)
    setMessage(undefined)
    setError(undefined)
    if (!file) return
    setReading(true)
    try {
      const text = await file.text()
      const nextPrepared = prepareBackup(parseBackupJson(text))
      if (selectionVersion.current !== version) return
      setPrepared(nextPrepared)
      setSelectedFileName(file.name)
      setMessage(`${file.name} is valid and ready for review.`)
    } catch (reason) {
      if (selectionVersion.current !== version) return
      setError(
        reason instanceof BackupValidationError
          ? `${reason.message} No existing Histask data was changed.`
          : 'Could not read this backup file. No existing Histask data was changed.',
      )
    } finally {
      if (selectionVersion.current === version) setReading(false)
    }
  }

  const replaceData = async () => {
    if (!prepared) return
    setError(undefined)
    setMessage(undefined)
    try {
      const started = await runMutation(async () => {
        await importService.replace(prepared)
      })
      if (!started) return
      setDialogOpen(false)
      setPrepared(undefined)
      setSelectedFileName('')
      if (fileInput.current) fileInput.current.value = ''
      setMessage('Backup restored. Histask now uses the imported local data.')
    } catch {
      setDialogOpen(false)
      setError('Could not restore this backup. Your previous data is unchanged.')
    }
  }

  return (
    <div className="grid gap-0 divide-y">
      <div className="settings-row">
        <Download className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="font-medium">Export backup</div>
          <p className="text-metadata text-muted-foreground">
            Save all Cards, WorkLogs, Categories, Tags, and tag links as JSON.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          onClick={() => void exportBackup()}
        >
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      </div>

      <div className="settings-row items-start">
        <Upload className="mt-0.5 size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <label htmlFor="backup-file" className="font-medium">
            Import backup
          </label>
          <p className="mb-2 text-metadata text-muted-foreground">
            The selected file is validated locally before replacement.
          </p>
          <Input
            ref={fileInput}
            id="backup-file"
            type="file"
            accept="application/json,.json"
            disabled={reading || writePending}
            className="max-w-md file:mr-3 file:border-0 file:bg-transparent file:text-ui file:font-medium"
            onChange={(event) => void readBackup(event.target.files?.[0])}
          />
          {prepared && (
            <div className="mt-2 flex items-center gap-2 text-metadata text-muted-foreground">
              <FileCheck2 className="size-3.5 text-success" />
              {prepared.counts.cards} Cards · {prepared.counts.workLogs}{' '}
              WorkLogs
            </div>
          )}
        </div>
        <Button
          ref={reviewButton}
          variant="outline"
          size="sm"
          disabled={!prepared || reading || writePending}
          onClick={() => setDialogOpen(true)}
        >
          {reading ? 'Validating…' : 'Review'}
        </Button>
      </div>

      {message && (
        <p className="px-3 py-2 text-metadata text-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="px-3 py-2 text-metadata text-destructive" role="alert">
          {error}
        </p>
      )}

      {prepared && (
        <ImportBackupDialog
          fileName={selectedFileName}
          onConfirm={() => void replaceData()}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          pending={writePending}
          prepared={prepared}
          returnFocusRef={reviewButton}
        />
      )}
    </div>
  )
}
