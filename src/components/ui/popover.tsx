import type { ComponentProps } from 'react'
import * as Primitive from '@radix-ui/react-popover'
import { cn } from '@/utils/cn'

export const Popover = Primitive.Root
export const PopoverTrigger = Primitive.Trigger
export const PopoverClose = Primitive.Close
export function PopoverContent({
  className,
  align = 'center',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 max-w-[calc(100vw-2rem)] rounded-card border bg-popover p-3 text-ui text-popover-foreground shadow-overlay ui-fade',
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  )
}
