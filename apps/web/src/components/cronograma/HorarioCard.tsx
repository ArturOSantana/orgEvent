import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { Button } from '../ui/Button'
import type { Horario } from '../../services/cronogramaService'

interface HorarioCardProps {
  horario: Horario
  podeEditar: boolean
  onEditar: () => void
  onRemover: () => void
}

export function HorarioCard({
  horario,
  podeEditar,
  onEditar,
  onRemover,
}: HorarioCardProps) {
  return (
    <div
      className="bg-white rounded-md border border-gray-200 px-4 py-3 flex gap-3"
      style={{ borderLeft: '4px solid #1e3a5f' }}
    >
      {/* Conteudo principal */}
      <div className="flex-1 min-w-0">
        {/* Horario */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <ClockCircleOutlined />
          <span>
            {horario.horaInicio} — {horario.horaFim}
          </span>
        </div>

        {/* Titulo */}
        <p className="text-sm font-semibold text-gray-900 truncate">{horario.titulo}</p>

        {/* Local */}
        {horario.local && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <EnvironmentOutlined />
            <span className="truncate">{horario.local}</span>
          </div>
        )}

        {/* Descricao */}
        {horario.descricao && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{horario.descricao}</p>
        )}
      </div>

      {/* Acoes — visíveis apenas para quem pode editar */}
      {podeEditar && (
        <div className="flex items-start gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={<EditOutlined />}
            onClick={onEditar}
            aria-label="Editar horario"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<DeleteOutlined />}
            onClick={onRemover}
            aria-label="Remover horario"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      )}
    </div>
  )
}
