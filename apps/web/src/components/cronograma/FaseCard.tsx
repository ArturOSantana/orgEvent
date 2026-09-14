import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button } from '../ui/Button'
import { HorarioCard } from './HorarioCard'
import type { Fase, Horario } from '../../services/cronogramaService'

interface FaseCardProps {
  fase: Fase
  horarios: Horario[]
  podeEditar: boolean
  onEditarFase: () => void
  onAdicionarHorario: () => void
  onEditarHorario: (horario: Horario) => void
  onRemoverHorario: (horario: Horario) => void
}

export function FaseCard({
  fase,
  horarios,
  podeEditar,
  onEditarFase,
  onAdicionarHorario,
  onEditarHorario,
  onRemoverHorario,
}: FaseCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Cabecalho da fase */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">{fase.nome}</h3>
        {podeEditar && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<EditOutlined />}
              onClick={onEditarFase}
              aria-label="Editar fase"
            >
              Editar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<PlusOutlined />}
              onClick={onAdicionarHorario}
            >
              Adicionar horario
            </Button>
          </div>
        )}
      </div>

      {/* Lista de horarios */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {horarios.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Nenhum horario nesta fase
          </p>
        ) : (
          horarios.map((h) => (
            <HorarioCard
              key={h.id}
              horario={h}
              podeEditar={podeEditar}
              onEditar={() => onEditarHorario(h)}
              onRemover={() => onRemoverHorario(h)}
            />
          ))
        )}
      </div>
    </div>
  )
}
