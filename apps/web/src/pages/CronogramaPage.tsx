import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { PlusOutlined, FilePdfOutlined, PlusCircleOutlined } from '@ant-design/icons'
import {
  listarFases,
  listarHorarios,
  removerHorario,
} from '../services/cronogramaService'
import type { Fase, Horario } from '../services/cronogramaService'
import { FaseCard } from '../components/cronograma/FaseCard'
import { FaseForm } from '../components/cronograma/FaseForm'
import { HorarioForm } from '../components/cronograma/HorarioForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { exportarArquivo } from '../utils/exportar'

// Fase virtual para horarios sem faseId
const FASE_SEM_FASE: Fase = {
  id: '__sem_fase__',
  eventoId: '',
  nome: 'Sem fase',
  ordem: Infinity as unknown as number,
  criadoEm: '',
  atualizadoEm: '',
}

export function CronogramaPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((s) => s.usuario)
  const podeEditar =
    usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'

  const [fases, setFases] = useState<Fase[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')
  const [exportando, setExportando] = useState(false)

  // Modais
  const [modalFaseAberto, setModalFaseAberto] = useState(false)
  const [faseEmEdicao, setFaseEmEdicao] = useState<Fase | undefined>()

  const [modalHorarioAberto, setModalHorarioAberto] = useState(false)
  const [horarioEmEdicao, setHorarioEmEdicao] = useState<Horario | undefined>()
  // Quando adicionando horario a partir de um FaseCard — pre-seleciona a fase
  const [faseIdParaHorario, setFaseIdParaHorario] = useState<string | undefined>()

  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const [fasesResp, horariosResp] = await Promise.all([
        listarFases(eventoId),
        listarHorarios(eventoId),
      ])
      setFases(fasesResp)
      setHorarios(horariosResp)
    } catch {
      setErroMsg('Não foi possível carregar o cronograma. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // ── Fase ────────────────────────────────────────────────────────────────────

  function abrirNovaFase() {
    setFaseEmEdicao(undefined)
    setModalFaseAberto(true)
  }

  function abrirEditarFase(fase: Fase) {
    setFaseEmEdicao(fase)
    setModalFaseAberto(true)
  }

  function fecharModalFase() {
    setModalFaseAberto(false)
    setFaseEmEdicao(undefined)
  }

  function handleFaseSalva(faseSalva: Fase) {
    setFases((prev) => {
      const idx = prev.findIndex((f) => f.id === faseSalva.id)
      if (idx >= 0) {
        const nova = [...prev]
        nova[idx] = faseSalva
        return nova
      }
      return [...prev, faseSalva]
    })
    fecharModalFase()
  }

  // ── Horario ─────────────────────────────────────────────────────────────────

  function abrirNovoHorario(faseId?: string) {
    setHorarioEmEdicao(undefined)
    setFaseIdParaHorario(faseId)
    setModalHorarioAberto(true)
  }

  function abrirEditarHorario(horario: Horario) {
    setHorarioEmEdicao(horario)
    setFaseIdParaHorario(undefined)
    setModalHorarioAberto(true)
  }

  function fecharModalHorario() {
    setModalHorarioAberto(false)
    setHorarioEmEdicao(undefined)
    setFaseIdParaHorario(undefined)
  }

  function handleHorarioSalvo(horarioSalvo: Horario) {
    setHorarios((prev) => {
      const idx = prev.findIndex((h) => h.id === horarioSalvo.id)
      if (idx >= 0) {
        const novo = [...prev]
        novo[idx] = horarioSalvo
        return novo
      }
      return [...prev, horarioSalvo]
    })
    fecharModalHorario()
  }

  async function handleRemoverHorario(horario: Horario) {
    if (!eventoId) return
    const confirmado = window.confirm(
      `Remover horario "${horario.titulo}"? Esta acao nao pode ser desfeita.`,
    )
    if (!confirmado) return
    try {
      await removerHorario(eventoId, horario.id)
      setHorarios((prev) => prev.filter((h) => h.id !== horario.id))
    } catch {
      alert('Não foi possível remover o horário. Tente novamente.')
    }
  }

  // ── Exportacao PDF ──────────────────────────────────────────────────────────

  async function exportarPDF() {
    if (!eventoId) return
    setExportando(true)
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/cronograma.pdf`,
        'cronograma.pdf',
      )
    } finally {
      setExportando(false)
    }
  }

  // ── Ordenacao e agrupamento ─────────────────────────────────────────────────

  const fasesSorted = [...fases].sort((a, b) => a.ordem - b.ordem)

  // Horarios sem fase vao para a fase virtual ao final
  const horariosSemFase = horarios.filter((h) => !h.faseId)
  const mostrarSemFase = horariosSemFase.length > 0

  function horariosDestaFase(faseId: string) {
    return horarios
      .filter((h) => h.faseId === faseId)
      .sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data)
        return a.horaInicio.localeCompare(b.horaInicio)
      })
  }

  // ── Horario com faseId pre-selecionado para o form ──────────────────────────
  // Cria um horario parcial só para pre-popular o select de fase no form
  const horarioParaForm: Horario | undefined = horarioEmEdicao
    ? horarioEmEdicao
    : faseIdParaHorario
      ? ({
          id: '',
          eventoId: eventoId ?? '',
          faseId: faseIdParaHorario,
          titulo: '',
          data: '',
          horaInicio: '',
          horaFim: '',
          ordem: 0,
          criadoEm: '',
          atualizadoEm: '',
        } as Horario)
      : undefined

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />
      {/* Cabecalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Cronograma</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={<FilePdfOutlined />}
            onClick={exportarPDF}
            loading={exportando}
          >
            Exportar PDF
          </Button>
          {podeEditar && (
            <Button
              variant="primary"
              icon={<PlusOutlined />}
              onClick={abrirNovaFase}
            >
              Nova Fase
            </Button>
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
      ) : fases.length === 0 && !mostrarSemFase ? (
        <EmptyState
          title="Nenhuma fase cadastrada"
          description="Crie a primeira fase clicando em &quot;Nova Fase&quot;."
          action={
            podeEditar ? (
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={abrirNovaFase}
              >
                Nova Fase
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {fasesSorted.map((fase) => (
            <FaseCard
              key={fase.id}
              fase={fase}
              horarios={horariosDestaFase(fase.id)}
              podeEditar={podeEditar}
              onEditarFase={() => abrirEditarFase(fase)}
              onAdicionarHorario={() => abrirNovoHorario(fase.id)}
              onEditarHorario={abrirEditarHorario}
              onRemoverHorario={handleRemoverHorario}
            />
          ))}

          {/* Fase virtual "Sem fase" — apenas se houver horarios sem faseId */}
          {mostrarSemFase && (
            <FaseCard
              fase={{ ...FASE_SEM_FASE, eventoId: eventoId ?? '' }}
              horarios={horariosSemFase.sort((a, b) => {
                if (a.data !== b.data) return a.data.localeCompare(b.data)
                return a.horaInicio.localeCompare(b.horaInicio)
              })}
              podeEditar={podeEditar}
              onEditarFase={() => {}}
              onAdicionarHorario={() => abrirNovoHorario(undefined)}
              onEditarHorario={abrirEditarHorario}
              onRemoverHorario={handleRemoverHorario}
            />
          )}
        </div>
      )}

      {/* FAB mobile */}
      {podeEditar && (
        <button
          onClick={() => abrirNovoHorario()}
          aria-label="Adicionar horario"
          className="fixed bottom-20 right-5 z-40 flex sm:hidden items-center justify-center w-14 h-14 rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
        >
          <PlusCircleOutlined className="text-2xl" />
        </button>
      )}

      {/* Modal fase */}
      {modalFaseAberto && eventoId && (
        <FaseForm
          eventoId={eventoId}
          fase={faseEmEdicao}
          onSuccess={handleFaseSalva}
          onCancel={fecharModalFase}
        />
      )}

      {/* Modal horario */}
      {modalHorarioAberto && eventoId && (
        <HorarioForm
          eventoId={eventoId}
          fases={fases}
          horario={horarioParaForm}
          onSuccess={handleHorarioSalvo}
          onCancel={fecharModalHorario}
        />
      )}
    </div>
  )
}
