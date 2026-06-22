import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

const variants = {
  primary:    'bg-[#0D2545] text-white hover:bg-[#0D2545]/90',
  gold:       'bg-[#C9A84C] text-white hover:bg-[#C9A84C]/90',
  'gold-ghost': 'text-[#C9A84C] hover:bg-[#C9A84C]/10',
  danger:     'bg-red-500 text-white hover:bg-red-600',
  success:    'bg-emerald-500 text-white hover:bg-emerald-600',
  outline:    'border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700',
} as const

const sizes = {
  xs:        'rounded-lg px-2.5 py-1.5 text-xs font-medium',
  sm:        'rounded-lg px-3 py-2 text-sm font-medium',
  md:        'rounded-lg px-4 py-2 text-sm font-semibold',
  lg:        'rounded-lg px-5 py-2.5 text-sm font-semibold',
  full:      'w-full rounded-lg py-2.5 text-sm font-semibold',
  'icon-sm': 'flex h-7 w-7 items-center justify-center rounded-lg',
  'icon-md': 'flex h-8 w-8 items-center justify-center rounded-lg',
  'icon-lg': 'flex h-9 w-9 items-center justify-center rounded-full',
} as const

export type BtnVariant = keyof typeof variants
export type BtnSize    = keyof typeof sizes

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
}

/** Helper cho <Link> styled as button */
export function btnCls(variant: BtnVariant = 'primary', size: BtnSize = 'md', extra?: string) {
  return cn('inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60', variants[variant], sizes[size], extra)
}

const Btn = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={btnCls(variant, size, className)}
      {...props}
    />
  )
)
Btn.displayName = 'Btn'
export default Btn
