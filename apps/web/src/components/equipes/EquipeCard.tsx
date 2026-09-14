import { TeamOutlined } from '@ant-design/icons'
import type { Equipe } from '../../services/equipeService'

interface EquipeCardProps {
  equipe: Equipe
  onClick: () => void
}

export function EquipeCard({ equipe, onClick }: EquipeCardProps) {
  const totalMembros = equipe._count?.membros ?? equipe.membros?.length ?? 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 px-5 py-4 flex flex-col gap-2 hover:shadow-md hover:border-primary-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl text-primary-600">
          <TeamOutlined />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{equipe.nome}</p>
          {equipe.descricao && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{equipe.descricao}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        {totalMembros} {totalMembros === 1 ? 'membro' : 'membros'}
      </p>
    </button>
  )
}
