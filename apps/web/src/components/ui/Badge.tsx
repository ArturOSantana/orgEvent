import clsx from 'clsx'

export type BadgeColor = 'blue' | 'green' | 'yellow' | 'red' | 'gray'

interface BadgeProps {
  label: string
  color?: BadgeColor
}

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-600',
}

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        colorClasses[color],
      )}
    >
      {label}
    </span>
  )
}
