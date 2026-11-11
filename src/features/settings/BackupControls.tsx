import { useRef, useState } from 'react'
import { Download, FileCheck2, FileJson, Upload, X } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import {
  BackupExportService,
  BackupImportService,
  BackupValidationError,
  parseBackupJson,
  prepareBackup,
  type PreparedBackup,
} from '@/services/backup'
import { cn } from '@/utils/cn'
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
  const { messages } = useI18n()
  const [exporting, setExporting] = useState(false)
  const [reading, setReading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [prepared, setPrepared] = useState<PreparedBackup>()
  const [selectedFileName, setSelectedFileName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exportMessage, setExportMessage] = useState<string>()
  const [exportError, setExportError] = useState<string>()
  const [importMessage, setImportMessage] = useState<string>()
  const [importError, setImportError] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  const reviewButton = useRef<HTMLButtonElement>(null)
  const selectionVersion = useRef(0)
  const exportLock = useRef(false)

  const clearSelectedFile = () => {
    selectionVersion.current += 1
    setPrepared(undefined)
    setSelectedFileName('')
    setDialogOpen(false)
    setReading(false)
    setDragOver(false)
    setImportMessage(undefined)
    setImportError(undefined)
    if (fileInput.current) fileInput.current.value = ''
  }

  const exportBackup = async () => {
    if (exportLock.current) return
    exportLock.current = true
    setExporting(true)
    setExportMessage(undefined)
    setExportError(undefined)
    try {
      const backup = await exportService.export()
      downloadJson(backup.json, backup.filename, backup.mimeType)
      setExportMessage(messages.settings.exportSuccess(backup.filename))
    } catch {
      setExportError(messages.settings.exportError)
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
    setImportMessage(undefined)
    setImportError(undefined)
    if (!file) return
    setSelectedFileName(file.name)
    setReading(true)
    try {
      const text = await file.text()
      const nextPrepared = prepareBackup(parseBackupJson(text))
      if (selectionVersion.current !== version) return
      setPrepared(nextPrepared)
      setImportMessage(messages.settings.importValidMessage(file.name))
    } catch (reason) {
      if (selectionVersion.current !== version) return
      setImportError(
        reason instanceof BackupValidationError
          ? messages.settings.importInvalidPrefix(reason.message)
          : messages.settings.importReadError,
      )
    } finally {
      if (selectionVersion.current === version) setReading(false)
    }
  }

  const replaceData = async () => {
    if (!prepared) return
    setImportError(undefined)
    setImportMessage(undefined)
    try {
      const started = await runMutation(async () => {
        await importService.replace(prepared)
      })
      if (!started) return
      setDialogOpen(false)
      setPrepared(undefined)
      setSelectedFileName('')
      if (fileInput.current) fileInput.current.value = ''
      setImportMessage(messages.settings.importRestoreSuccess)
    } catch {
      setDialogOpen(false)
      setImportError(messages.settings.importRestoreError)
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-0 divide-y">
      <div className="settings-row min-w-0 flex-col items-stretch gap-2">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{messages.settings.exportTitle}</div>
              <p className="mt-0.5 text-metadata text-muted-foreground">
                {messages.settings.exportDescription}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 pl-7 sm:pl-0">
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={() => void exportBackup()}
            >
              {exporting
                ? messages.settings.exportingButton
                : messages.settings.exportButton}
            </Button>
          </div>
        </div>
        {exportMessage && (
          <p className="text-metadata text-success sm:ml-7" role="status">
            {exportMessage}
          </p>
        )}
        {exportError && (
          <p className="text-metadata text-destructive sm:ml-7" role="alert">
            {exportError}
          </p>
        )}
      </div>

      <div className="settings-row min-w-0 flex-col items-stretch gap-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Upload className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <label htmlFor="backup-file" className="cursor-pointer font-medium">
                {messages.settings.importTitle}
              </label>
              <p className="mt-0.5 text-metadata text-muted-foreground">
                {messages.settings.importDescription}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 pl-7 sm:pl-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reading || writePending}
              onClick={() => fileInput.current?.click()}
            >
              {selectedFileName
                ? messages.settings.importChangeButton
                : messages.settings.importChooseButton}
            </Button>
            {(selectedFileName || importError) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={messages.settings.importClearButton}
                disabled={reading || writePending}
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={clearSelectedFile}
              >
                <X className="size-3.5" />
              </Button>
            )}
            <Button
              ref={reviewButton}
              variant={prepared ? 'default' : 'outline'}
              size="sm"
              disabled={!prepared || reading || writePending}
              onClick={() => setDialogOpen(true)}
            >
              {reading
                ? messages.settings.importReadingButton
                : messages.settings.importReviewButton}
            </Button>
          </div>
        </div>

        <input
          ref={fileInput}
          id="backup-file"
          type="file"
          accept="application/json,.json"
          disabled={reading || writePending}
          className="sr-only"
          onChange={(event) => void readBackup(event.target.files?.[0])}
        />

        <div
          onDragOver={(event) => {
            if (reading || writePending) return
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            if (reading || writePending) return
            void readBackup(event.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-control border border-dashed px-3 py-2 text-metadata transition-colors sm:ml-7',
            dragOver
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50 text-foreground'
              : prepared
                ? 'border-[var(--success)]/45 bg-[var(--success)]/8 text-foreground'
                : 'border-border bg-surface-subtle/60 text-muted-foreground',
          )}
        >
          {prepared ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <FileCheck2 className="size-3.5 shrink-0 text-success" />
              <span className="max-w-full truncate font-medium text-foreground">
                {selectedFileName}
              </span>
              <span className="text-muted-foreground">
                {messages.settings.importValidSummary(
                  prepared.counts.cards,
                  prepared.counts.workLogs,
                  prepared.counts.categories,
                  prepared.counts.tags,
                )}
              </span>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <FileJson className="mt-0.5 size-3.5 shrink-0" />
              {selectedFileName ? (
                <span className="min-w-0 truncate">{selectedFileName}</span>
              ) : (
                <span className="min-w-0 leading-snug">
                  {messages.settings.importDropHint}
                </span>
              )}
            </div>
          )}
        </div>

        {importMessage && (
          <p className="text-metadata text-success sm:ml-7" role="status">
            {importMessage}
          </p>
        )}
        {importError && (
          <p className="text-metadata text-destructive sm:ml-7" role="alert">
            {importError}
          </p>
        )}
      </div>

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
