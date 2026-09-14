import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import type { Evento } from '../../services/eventoService'
import { EventoStatusBadge } from './EventoStatusBadge'

interface EventoCardProps {
  evento: Evento
  onClick: () => void
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const aaaa = d.getFullYear()
  const HH = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${aaaa} ${HH}:${min}`
}

export function EventoCard({ evento, onClick }: EventoCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400"
    >
      {/* Cabecalho do card */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {evento.nome}
        </h3>
        <div className="shrink-0">
          <EventoStatusBadge status={evento.status} />
        </div>
      </div>

      {/* Tipo */}
      <p className="text-xs text-gray-500 mb-3">{evento.tipo}</p>

      {/* Datas e local */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <CalendarOutlined className="shrink-0 text-gray-400" />
          <span>
            {formatarData(evento.dataInicio)} — {formatarData(evento.dataFim)}
          </span>
        </div>

        {evento.local && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <EnvironmentOutlined className="shrink-0 text-gray-400" />
            <span className="truncate">{evento.local}</span>
          </div>
        )}
      </div>
    </div>
  )
}
