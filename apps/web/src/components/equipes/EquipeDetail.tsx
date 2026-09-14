import { useState, useEffect, useCallback } from 'react'
import { PlusOutlined, FilePdfOutlined, CloseOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { VoluntarioCard } from '../voluntarios/VoluntarioCard'
import { AdicionarMembroModal } from './AdicionarMembroModal'
import {
  buscarEquipe,
  listarFuncoes,
  removerMembro,
  deletarEquipe,
  exportarEscalasPdfUrl,
} from '../../services/equipeService'
import type { Equipe, MembroEquipe, Funcao } from '../../services/equipeService'

interface EquipeDetailProps {
  eventoId: string
  equipeId: string
  podeEditar: boolean
  onClose: () => void
  onEditar?: (equipe: Equipe) => void
  onApagada?: (equipeId: string) => void
}

export function EquipeDetail({ eventoId, equipeId, podeEditar, onClose, onEditar, onApagada }: EquipeDetailProps) {
  const [equipe, setEquipe] = useState<Equipe | null>(null)
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')
  const [adicionarMembroAberto, setAdicionarMembroAberto] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroMsg('')
    try {
      const [equipeResp, funcoesResp] = await Promise.all([
        buscarEquipe(eventoId, equipeId),
        listarFuncoes(eventoId),
      ])
      setEquipe(equipeResp)
      setFuncoes(funcoesResp)
    } catch {
      setErroMsg('Nao foi possivel carregar os dados da equipe.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId, equipeId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleRemoverMembro(membro: MembroEquipe) {
    const confirmado = window.confirm(
      `Remover ${membro.voluntario.nome} da equipe? Esta acao nao pode ser desfeita.`,
    )
    if (!confirmado) return
    try {
      await removerMembro(eventoId, equipeId, membro.id)
      setEquipe((prev) =>
        prev
          ? {
              ...prev,
              membros: prev.membros?.filter((m) => m.id !== membro.id),
              _count: { membros: (prev._count?.membros ?? 1) - 1 },
            }
          : prev,
      )
    } catch {
      alert('Nao foi possivel remover o membro. Tente novamente.')
    }
  }

  async function handleApagarEquipe() {
    if (!equipe) return
    const confirmado = window.confirm(
      `Apagar a equipe "${equipe.nome}"? Todos os membros serao removidos. Esta acao nao pode ser desfeita.`,
    )
    if (!confirmado) return
    try {
      await deletarEquipe(eventoId, equipeId)
      onApagada?.(equipeId)
      onClose()
    } catch {
      alert('Nao foi possivel apagar a equipe. Tente novamente.')
    }
  }

  function handleMembroAdicionado() {
    setAdicionarMembroAberto(false)
    carregar()
  }

  function exportarPDF() {
    const url = exportarEscalasPdfUrl(eventoId)
    const link = document.createElement('a')
    link.href = url
    link.download = 'escalas.pdf'
    link.click()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabecalho */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {equipe?.nome ?? 'Equipe'}
          </h2>
          {equipe?.descricao && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{equipe.descricao}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-3 p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <CloseOutlined />
        </button>
      </div>

      {/* Barra de acoes */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          icon={<FilePdfOutlined />}
          onClick={exportarPDF}
        >
          Exportar Escala PDF
        </Button>
        {podeEditar && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={<EditOutlined />}
              onClick={() => equipe && onEditar?.(equipe)}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<DeleteOutlined />}
              onClick={handleApagarEquipe}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Apagar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusOutlined />}
              onClick={() => setAdicionarMembroAberto(true)}
            >
              Adicionar membro
            </Button>
          </>
        )}
      </div>

      {/* Conteudo */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {erroMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
            {erroMsg}
          </p>
        )}

        {carregando ? (
          <div className="flex justify-center items-center py-16">
            <Spinner className="w-7 h-7 text-primary-600" />
          </div>
        ) : !equipe?.membros || equipe.membros.length === 0 ? (
          <EmptyState
            title="Nenhum membro nesta equipe"
            description="Adicione voluntarios clicando em &quot;Adicionar membro&quot;."
            action={
              podeEditar ? (
                <Button
                  variant="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAdicionarMembroAberto(true)}
                >
                  Adicionar membro
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {equipe.membros.map((membro) => (
              <VoluntarioCard
                key={membro.id}
                membro={membro}
                podeEditar={podeEditar}
                onRemover={() => handleRemoverMembro(membro)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal adicionar membro */}
      {equipe && (
        <AdicionarMembroModal
          eventoId={eventoId}
          equipeId={equipeId}
          funcoes={funcoes}
          open={adicionarMembroAberto}
          onClose={() => setAdicionarMembroAberto(false)}
          onSuccess={handleMembroAdicionado}
        />
      )}
    </div>
  )
}
