import { forwardRef, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:ring-red-400'
              : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
