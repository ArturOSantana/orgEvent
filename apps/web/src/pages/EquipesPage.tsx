import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { PlusOutlined, TagOutlined, FilePdfOutlined } from '@ant-design/icons'
import { listarEquipes, listarFuncoes } from '../services/equipeService'
import type { Equipe, Funcao } from '../services/equipeService'
import { EquipeCard } from '../components/equipes/EquipeCard'
import { EquipeForm } from '../components/equipes/EquipeForm'
import { EquipeDetail } from '../components/equipes/EquipeDetail'
import { FuncaoForm } from '../components/equipes/FuncaoForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { exportarArquivo } from '../utils/exportar'

export function EquipesPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((s) => s.usuario)
  const podeEditar =
    usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'

  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')
  const [exportando, setExportando] = useState(false)

  // Drawer / detalhe
  const [equipeDetalheId, setEquipeDetalheId] = useState<string | null>(null)

  // Modais
  const [modalEquipeAberto, setModalEquipeAberto] = useState(false)
  const [equipeParaEditar, setEquipeParaEditar] = useState<Equipe | undefined>(undefined)
  const [modalFuncaoAberto, setModalFuncaoAberto] = useState(false)

  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const [equipesResp, funcoesResp] = await Promise.all([
        listarEquipes(eventoId),
        listarFuncoes(eventoId),
      ])
      setEquipes(equipesResp)
      setFuncoes(funcoesResp)
    } catch {
      setErroMsg('Não foi possível carregar as equipes. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  function handleEquipeSalva(equipe: Equipe) {
    setEquipes((prev) => {
      const idx = prev.findIndex((e) => e.id === equipe.id)
      if (idx >= 0) {
        const nova = [...prev]
        nova[idx] = equipe
        return nova
      }
      return [...prev, equipe]
    })
    setModalEquipeAberto(false)
    setEquipeParaEditar(undefined)
  }

  function handleEditarEquipe(equipe: Equipe) {
    setEquipeParaEditar(equipe)
    setModalEquipeAberto(true)
  }

  function handleEquipeApagada(id: string) {
    setEquipes((prev) => prev.filter((e) => e.id !== id))
    setEquipeDetalheId(null)
  }

  function handleFuncaoCriada(funcao: Funcao) {
    setFuncoes((prev) => [...prev, funcao])
    setModalFuncaoAberto(false)
  }

  async function exportarPDF() {
    if (!eventoId) return
    setExportando(true)
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/escalas.pdf`,
        'escalas.pdf',
      )
    } finally {
      setExportando(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-20 h-full">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />
      {/* Cabecalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Equipes</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            icon={<FilePdfOutlined />}
            onClick={exportarPDF}
            loading={exportando}
          >
            Exportar Escalas PDF
          </Button>
          {podeEditar && (
            <>
              <Button
                variant="ghost"
                icon={<TagOutlined />}
                onClick={() => setModalFuncaoAberto(true)}
              >
                Nova Função
              </Button>
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalEquipeAberto(true)}
              >
                Nova Equipe
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Erro */}
      {erroMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {erroMsg}
        </p>
      )}

      {/* Conteudo */}
      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="w-8 h-8 text-primary-600" />
        </div>
      ) : equipes.length === 0 ? (
        <EmptyState
          title="Nenhuma equipe cadastrada"
          description="Crie a primeira equipe clicando em &quot;Nova Equipe&quot;."
          action={
            podeEditar ? (
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalEquipeAberto(true)}
              >
                Nova Equipe
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Grid de equipes */}
          <div
            className={`grid gap-4 content-start transition-all duration-200 ${
              equipeDetalheId
                ? 'grid-cols-1 sm:grid-cols-1 w-full sm:w-64 shrink-0'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-1'
            }`}
          >
            {equipes.map((equipe) => (
              <EquipeCard
                key={equipe.id}
                equipe={equipe}
                onClick={() =>
                  setEquipeDetalheId(equipeDetalheId === equipe.id ? null : equipe.id)
                }
              />
            ))}
          </div>

          {/* Painel de detalhe — drawer lateral no desktop */}
          {equipeDetalheId && eventoId && (
            <div className="hidden sm:flex flex-col flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
              <EquipeDetail
                eventoId={eventoId}
                equipeId={equipeDetalheId}
                podeEditar={podeEditar}
                onClose={() => setEquipeDetalheId(null)}
                onEditar={handleEditarEquipe}
                onApagada={handleEquipeApagada}
              />
            </div>
          )}
        </div>
      )}

      {/* Detalhe fullscreen no mobile */}
      {equipeDetalheId && eventoId && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col sm:hidden">
          <EquipeDetail
            eventoId={eventoId}
            equipeId={equipeDetalheId}
            podeEditar={podeEditar}
            onClose={() => setEquipeDetalheId(null)}
            onEditar={handleEditarEquipe}
            onApagada={handleEquipeApagada}
          />
        </div>
      )}

      {/* Modal nova/editar equipe */}
      {modalEquipeAberto && eventoId && (
        <EquipeForm
          eventoId={eventoId}
          equipe={equipeParaEditar}
          onSuccess={handleEquipeSalva}
          onCancel={() => {
            setModalEquipeAberto(false)
            setEquipeParaEditar(undefined)
          }}
        />
      )}

      {/* Modal nova funcao */}
      {modalFuncaoAberto && eventoId && (
        <FuncaoForm
          eventoId={eventoId}
          onSuccess={handleFuncaoCriada}
          onCancel={() => setModalFuncaoAberto(false)}
        />
      )}
    </div>
  )
}
