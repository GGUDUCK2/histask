import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
      setOpen(false)
      setConfirmation('')
      setMessage('All local Histask data was deleted.')
    } catch {
      setError('Could not delete local data. Your previous data is unchanged.')
    }
  }

  return (
    <div className="settings-row items-start">
      <Trash2 className="mt-0.5 size-4 text-destructive" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">Delete all data</div>
        <p className="text-metadata text-muted-foreground">
          Permanently remove every local task, history entry, classification,
          and setting.
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
            Delete…
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all local data?</DialogTitle>
            <DialogDescription>
              This permanently deletes every Card and WorkLog from this browser
              profile. Export a backup first if you may need this data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="delete-confirmation">
              Type DELETE to confirm
            </Label>
            <Input
              id="delete-confirmation"
              autoComplete="off"
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmation !== 'DELETE' || writePending}
              onClick={() => void deleteAll()}
            >
              {writePending ? 'Deleting…' : 'Delete all data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
