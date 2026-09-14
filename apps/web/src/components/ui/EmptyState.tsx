import { type ReactNode } from 'react'
import { InboxOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl text-gray-300 mb-4">
        <InboxOutlined />
      </span>
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
