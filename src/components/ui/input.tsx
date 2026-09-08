import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'h-input w-full min-w-0 rounded-control border border-input bg-surface px-3 text-ui placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}
