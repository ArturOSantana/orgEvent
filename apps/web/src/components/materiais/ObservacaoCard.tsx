import { EditOutlined, MessageOutlined } from '@ant-design/icons'
import { Button } from '../ui/Button'
import type { Observacao } from '../../services/materialService'
import { useAuthStore } from '../../store/authStore'

interface ObservacaoCardProps {
  observacao: Observacao
  onEditar: (observacao: Observacao) => void
  podeEditar: boolean
}

function formatarData(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

export function ObservacaoCard({ observacao, onEditar, podeEditar }: ObservacaoCardProps) {
  const usuarioId = useAuthStore((state) => state.usuario?.id)
  const podeEditarObservacao = podeEditar && observacao.autorId === usuarioId

  return (
    <article className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <MessageOutlined className="mt-1 text-primary-600" />
          <div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{observacao.conteudo}</p>
            <p className="mt-3 text-xs text-gray-500">
              {observacao.autor?.nome ?? 'Autor desconhecido'} · {formatarData(observacao.criadoEm)}
            </p>
          </div>
        </div>
        {podeEditarObservacao && (
          <Button
            variant="ghost"
            size="sm"
            icon={<EditOutlined />}
            onClick={() => onEditar(observacao)}
            aria-label="Editar observacao"
          />
        )}
      </div>
    </article>
  )
}
