import { Badge, type BadgeColor } from '../ui/Badge'
import type { EventoStatus } from '../../services/eventoService'

interface EventoStatusBadgeProps {
  status: EventoStatus
}

const statusConfig: Record<EventoStatus, { label: string; color: BadgeColor }> = {
  planejamento: { label: 'Planejamento', color: 'blue' },
  em_andamento: { label: 'Em andamento', color: 'yellow' },
  concluido: { label: 'Concluido', color: 'green' },
  arquivado: { label: 'Arquivado', color: 'gray' },
}

export function EventoStatusBadge({ status }: EventoStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, color: 'gray' as BadgeColor }
  return <Badge label={config.label} color={config.color} />
}
