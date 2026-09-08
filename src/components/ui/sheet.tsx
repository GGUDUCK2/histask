import type { ComponentProps } from 'react'
import * as Primitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { DialogOverlay } from './dialog'

export const Sheet = Primitive.Root
export const SheetTrigger = Primitive.Trigger
export const SheetClose = Primitive.Close
export const SheetTitle = Primitive.Title
export const SheetDescription = Primitive.Description

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: ComponentProps<typeof Primitive.Content> & { side?: 'left' | 'right' }) {
  return (
    <Primitive.Portal>
      <DialogOverlay />
      <Primitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed inset-y-0 z-50 grid w-full content-start gap-4 overflow-y-auto border bg-surface p-5 text-foreground shadow-overlay ui-fade sm:w-[480px] sm:max-w-[calc(100vw-2rem)]',
          side === 'right'
            ? 'right-0 sm:rounded-l-overlay'
            : 'left-0 sm:rounded-r-overlay',
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex size-control-sm items-center justify-center rounded-control text-muted-foreground hover:bg-surface-hover"
        >
          <X className="size-4" />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  )
}
