import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import { Spinner } from './Spinner'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-400 border border-transparent',
  secondary:
    'bg-transparent text-primary-700 border border-primary-700 hover:bg-primary-50 focus:ring-primary-400',
  ghost:
    'bg-transparent text-[#57606a] border border-transparent hover:bg-gray-100 focus:ring-gray-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 border border-transparent',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-5 py-2.5 text-base rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner className="w-4 h-4" />
        ) : (
          icon && <span className="leading-none">{icon}</span>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
