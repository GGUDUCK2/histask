import type { ComponentProps } from 'react'
import * as Primitive from '@radix-ui/react-tooltip'
import { cn } from '@/utils/cn'

export const TooltipProvider = Primitive.Provider
export const Tooltip = Primitive.Root
export const TooltipTrigger = Primitive.Trigger
export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-[min(24rem,calc(100vw-2rem))] whitespace-pre-wrap break-words rounded-control border bg-popover px-3 py-2 text-ui text-popover-foreground shadow-overlay ui-fade',
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  )
}
