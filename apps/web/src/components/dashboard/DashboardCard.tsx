import { type ReactNode } from 'react'
import clsx from 'clsx'

interface DashboardCardProps {
  titulo: string
  valor: number | string
  icon: ReactNode
  cor?: 'blue' | 'green' | 'yellow' | 'red'
  onClick?: () => void
}

const borderColor: Record<string, string> = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  yellow: 'border-l-yellow-500',
  red: 'border-l-red-500',
}

const iconColor: Record<string, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
}

export function DashboardCard({ titulo, valor, icon, cor = 'blue', onClick }: DashboardCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={clsx(
        'bg-white border border-gray-200 rounded-lg p-4 border-l-4 flex items-center gap-4',
        borderColor[cor],
        onClick && 'cursor-pointer hover:brightness-95 transition-all',
      )}
    >
      <div className={clsx('text-2xl shrink-0', iconColor[cor])}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{valor}</p>
        <p className="text-xs text-gray-500 mt-1">{titulo}</p>
      </div>
    </div>
  )
}
