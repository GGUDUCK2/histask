import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useWorkspace,
  type ClassificationDialogState,
} from '@/features/workspace/workspace-context'
import { ValidationError } from '@/services/validation'
import {
  CLASSIFICATION_COLORS,
  type ClassificationColor,
} from '@/types/domain'
import { getClassificationMeta } from '@/utils/classification-styles'
import { cn } from '@/utils/cn'

export function ClassificationDialogs() {
  const { classificationDialog, closeClassificationDialog } = useWorkspace()

  if (!classificationDialog) return null

  const dialogKey = `${classificationDialog.kind}:${classificationDialog.mode}:${classificationDialog.itemId ?? 'new'}`

  return (
    <ClassificationDialogInner
      key={dialogKey}
      dialogState={classificationDialog}
      onClose={closeClassificationDialog}
    />
  )
}

function ClassificationDialogInner({
  dialogState,
  onClose,
}: {
  dialogState: NonNullable<ClassificationDialogState>
  onClose: () => void
}) {
  const { messages } = useI18n()
  const { snapshot, services } = useWorkspace()
  const isCategory = dialogState.kind === 'category'
  const isEdit = dialogState.mode === 'edit'

  const currentItem =
    isEdit && dialogState.itemId
      ? isCategory
        ? snapshot.categories.find((c) => c.id === dialogState.itemId)
        : snapshot.tags.find((t) => t.id === dialogState.itemId)
      : undefined

  const [name, setName] = useState(currentItem?.name ?? '')
  const [color, setColor] = useState<ClassificationColor>(
    currentItem?.color ?? 'slate',
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const submitLockRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const affectedCount =
    currentItem === undefined
      ? 0
      : isCategory
        ? (snapshot.categoryCardCounts.get(currentItem.id) ?? 0)
        : (snapshot.tagCardCounts.get(currentItem.id) ?? 0)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLockRef.current) return
    if (!name.trim()) {
      setError(
        isCategory
          ? messages.classifications.categoryRequiredError
          : messages.classifications.tagRequiredError,
      )
      inputRef.current?.focus()
      return
    }

    submitLockRef.current = true
    setBusy(true)
    setError(null)
    try {
      if (isEdit && currentItem) {
        if (isCategory) {
          await services.classification.updateCategory(currentItem.id, {
            name,
            color: color ?? null,
          })
        } else {
          await services.classification.updateTag(currentItem.id, {
            name,
            color: color ?? null,
          })
        }
      } else if (isCategory) {
        await services.classification.createCategory({ name, color })
      } else {
        await services.classification.createTag({ name, color })
      }
      onClose()
    } catch (caughtError) {
      if (caughtError instanceof ValidationError) {
        setError(caughtError.message)
      } else {
        setError(
          isCategory
            ? messages.classifications.categorySaveFallbackError
            : messages.classifications.tagSaveFallbackError,
        )
      }
    } finally {
      submitLockRef.current = false
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!currentItem || submitLockRef.current) return
    submitLockRef.current = true
    setBusy(true)
    setError(null)
    try {
      if (isCategory) {
        await services.classification.deleteCategory(currentItem.id)
      } else {
        await services.classification.deleteTag(currentItem.id)
      }
      setConfirmDeleteOpen(false)
      onClose()
    } catch {
      setError(
        isCategory
          ? messages.classifications.categoryDeleteFallbackError
          : messages.classifications.tagDeleteFallbackError,
      )
    } finally {
      submitLockRef.current = false
      setBusy(false)
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !busy) onClose()
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? isCategory
                  ? messages.classifications.editCategoryTitle
                  : messages.classifications.editTagTitle
                : isCategory
                  ? messages.classifications.newCategoryTitle
                  : messages.classifications.newTagTitle}
            </DialogTitle>
            <DialogDescription>
              {isCategory
                ? messages.classifications.categoryDescription
                : messages.classifications.tagDescription}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="classification-name-input">
                {messages.classifications.nameLabel}
              </Label>
              <Input
                ref={inputRef}
                id="classification-name-input"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (error) setError(null)
                }}
                placeholder={
                  isCategory
                    ? messages.classifications.categoryPlaceholder
                    : messages.classifications.tagPlaceholder
                }
                disabled={busy}
                aria-invalid={error !== null}
              />
            </div>

            <div className="grid gap-1.5">
              <span className="text-ui font-medium">
                {messages.classifications.colorLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                {CLASSIFICATION_COLORS.map((candidate) => {
                  const meta = getClassificationMeta(candidate)
                  const colorLabel = messages.colors[candidate]
                  const selected = color === candidate
                  return (
                    <button
                      key={candidate}
                      type="button"
                      aria-label={colorLabel}
                      aria-pressed={selected}
                      onClick={() => setColor(candidate)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-control border px-2 py-1 text-metadata transition-colors',
                        selected
                          ? 'border-foreground bg-surface-hover font-medium text-foreground'
                          : 'border-border bg-surface text-muted-foreground hover:bg-surface-hover',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('size-2.5 rounded-full', meta.dotClass)}
                      />
                      <span>{colorLabel}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-metadata text-[var(--danger)]">
                {error}
              </p>
            )}

            <DialogFooter className="justify-between pt-1">
              {isEdit && currentItem ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mr-auto text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={busy}
                >
                  <Trash2 className="size-3.5" />
                  {messages.common.delete}
                </Button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={busy}
                >
                  {messages.common.cancel}
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy
                    ? messages.common.saving
                    : isEdit
                      ? messages.common.save
                      : isCategory
                        ? messages.classifications.createCategory
                        : messages.classifications.createTag}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmDeleteOpen(false)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isCategory
                ? messages.classifications.deleteCategoryTitle
                : messages.classifications.deleteTagTitle}
            </DialogTitle>
            <DialogDescription>
              {isCategory
                ? messages.classifications.deleteCategoryDescription(
                    currentItem?.name ?? '',
                    affectedCount,
                  )
                : messages.classifications.deleteTagDescription(
                    currentItem?.name ?? '',
                    affectedCount,
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={busy}
            >
              {messages.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={busy}
            >
              {busy
                ? messages.common.deleting
                : isCategory
                  ? messages.classifications.deleteCategoryConfirm
                  : messages.classifications.deleteTagConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
