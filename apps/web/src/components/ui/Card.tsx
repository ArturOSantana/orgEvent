import { type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  title?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function Card({ title, children, actions, className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-5',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
