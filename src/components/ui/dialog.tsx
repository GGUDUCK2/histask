import type { ComponentProps } from 'react'
import * as Primitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Dialog = Primitive.Root
export const DialogTrigger = Primitive.Trigger
export const DialogClose = Primitive.Close
export const DialogPortal = Primitive.Portal

export function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof Primitive.Overlay>) {
  return (
    <Primitive.Overlay
      className={cn('fixed inset-0 z-50 bg-overlay ui-fade', className)}
      {...props}
    />
  )
}
export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Primitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-overlay border bg-surface p-5 text-foreground shadow-overlay ui-fade',
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
    </DialogPortal>
  )
}
export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-2 pr-8', className)} {...props} />
}
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-wrap justify-end gap-2', className)}
      {...props}
    />
  )
}
export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      className={cn('text-page-title font-semibold', className)}
      {...props}
    />
  )
}
export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={cn('text-ui text-muted-foreground', className)}
      {...props}
    />
  )
}
