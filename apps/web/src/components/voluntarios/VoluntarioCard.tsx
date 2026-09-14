import { UserOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button } from '../ui/Button'
import type { MembroEquipe } from '../../services/equipeService'

interface VoluntarioCardProps {
  membro: MembroEquipe
  onRemover?: () => void
  podeEditar?: boolean
}

export function VoluntarioCard({ membro, onRemover, podeEditar }: VoluntarioCardProps) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-md border border-gray-200 px-4 py-3">
      <span className="text-lg text-gray-400 mt-0.5">
        <UserOutlined />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{membro.voluntario.nome}</p>
          {membro.funcao && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
              {membro.funcao.nome}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 mt-1">
          {membro.voluntario.email && (
            <p className="text-xs text-gray-500">{membro.voluntario.email}</p>
          )}
          {membro.voluntario.telefone && (
            <p className="text-xs text-gray-500">{membro.voluntario.telefone}</p>
          )}
        </div>
      </div>

      {podeEditar && onRemover && (
        <Button
          variant="ghost"
          size="sm"
          icon={<DeleteOutlined />}
          onClick={onRemover}
          aria-label="Remover da equipe"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
        />
      )}
    </div>
  )
}
