import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { useTheme } from '@/app/theme-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DeleteAllDataService } from '@/services/delete-all-data'
import type { RunDataMutation } from './types'

export function DeleteAllDataDialog({
  runMutation,
  service,
  writePending,
}: {
  runMutation: RunDataMutation
  service: DeleteAllDataService
  writePending: boolean
}) {
  const { resetLocalTheme } = useTheme()
  const { messages, resetLocalLanguage } = useI18n()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  const changeOpen = (nextOpen: boolean) => {
    if (writePending) return
    setOpen(nextOpen)
    if (!nextOpen) {
      setConfirmation('')
      setError(undefined)
    }
  }

  const deleteAll = async () => {
    if (confirmation !== 'DELETE') return
    setError(undefined)
    setMessage(undefined)
    try {
      const started = await runMutation(() => service.deleteAll())
      if (!started) return
      resetLocalTheme()
      resetLocalLanguage()
      setOpen(false)
      setConfirmation('')
      setMessage(messages.settings.deleteAllSuccess)
    } catch {
      setError(messages.settings.deleteAllError)
    }
  }

  return (
    <div className="settings-row items-start">
      <Trash2 className="mt-0.5 size-4 text-destructive" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{messages.settings.deleteAllTitle}</div>
        <p className="text-metadata text-muted-foreground">
          {messages.settings.deleteAllDescription}
        </p>
        {message && (
          <p className="mt-1 text-metadata text-success" role="status">
            {message}
          </p>
        )}
      </div>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={writePending}
            className="text-destructive"
          >
            {messages.settings.deleteAllTrigger}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.settings.deleteAllDialogTitle}</DialogTitle>
            <DialogDescription>
              {messages.settings.deleteAllDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="delete-confirmation">
              {messages.settings.deleteAllConfirmLabel}
            </Label>
            <Input
              id="delete-confirmation"
              autoComplete="off"
              placeholder={messages.settings.deleteAllConfirmPlaceholder}
              value={confirmation}
              disabled={writePending}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            {error && (
              <p className="text-metadata text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={writePending}
              onClick={() => changeOpen(false)}
            >
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={confirmation !== 'DELETE' || writePending}
              onClick={() => void deleteAll()}
            >
              {writePending
                ? messages.common.deleting
                : messages.settings.deleteAllConfirmButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
