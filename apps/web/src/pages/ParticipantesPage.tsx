import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import {
  PlusOutlined,
  UploadOutlined,
  FileExcelOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import {
  listarParticipantes,
  type Participante,
} from '../services/participanteService'
import { useDebounce } from '../hooks/useDebounce'
import { listarEquipes } from '../services/equipeService'
import type { Equipe } from '../services/equipeService'
import { ParticipanteRow } from '../components/participantes/ParticipanteRow'
import { ParticipanteForm } from '../components/participantes/ParticipanteForm'
import { AlocarEquipeModal } from '../components/participantes/AlocarEquipeModal'
import { AlocarQuartoModal } from '../components/participantes/AlocarQuartoModal'
import { ImportarCsvModal } from '../components/participantes/ImportarCsvModal'
import { listarQuartos, type Quarto } from '../services/quartoService'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuthStore } from '../store/authStore'
import { exportarArquivo } from '../utils/exportar'

const LIMIT = 20

const STATUS_FILTRO_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function ParticipantesPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((s) => s.usuario)
  const podeEditar =
    usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'

  // Dados
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [total, setTotal] = useState(0)
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')

  // Filtros e paginacao
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroEquipe, setFiltroEquipe] = useState('')
  const [filtroQuarto, setFiltroQuarto] = useState('')
  const [page, setPage] = useState(1)
  const [exportando, setExportando] = useState(false)
  const buscaDebounced = useDebounce(busca)

  // Modais
  const [formAberto, setFormAberto] = useState(false)
  const [participanteEditando, setParticipanteEditando] = useState<Participante | undefined>()
  const [importarAberto, setImportarAberto] = useState(false)
  const [alocarParticipante, setAlocarParticipante] = useState<Participante | null>(null)
  const [alocarQuartoParticipante, setAlocarQuartoParticipante] = useState<Participante | null>(null)

  // ── Carrega equipes e quartos ─────────────────────────────────────────────────
  useEffect(() => {
    if (!eventoId) return
    listarEquipes(eventoId)
      .then(setEquipes)
      .catch(() => {/* silencia — equipes sao opcionais nos filtros */})
    listarQuartos(eventoId)
      .then(setQuartos)
      .catch(() => {/* silencia — quartos sao opcionais nos filtros */})
  }, [eventoId])

  // ── Carrega participantes ───────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const resp = await listarParticipantes(eventoId, {
        busca: buscaDebounced || undefined,
        status: filtroStatus || undefined,
        equipeId: filtroEquipe || undefined,
        quartoId: filtroQuarto || undefined,
        page,
        limit: LIMIT,
      })
      setParticipantes(resp.data)
      setTotal(resp.total)
    } catch {
      setErroMsg('Não foi possível carregar os participantes. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId, buscaDebounced, filtroStatus, filtroEquipe, filtroQuarto, page])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Ao mudar filtros, voltar para pagina 1
  function handleBusca(v: string) {
    setBusca(v)
    setPage(1)
  }
  function handleFiltroStatus(v: string) {
    setFiltroStatus(v)
    setPage(1)
  }
  function handleFiltroEquipe(v: string) {
    setFiltroEquipe(v)
    setPage(1)
  }
  function handleFiltroQuarto(v: string) {
    setFiltroQuarto(v)
    setPage(1)
  }

  // ── Handlers de modais ──────────────────────────────────────────────────────
  function handleNovoParticipante() {
    setParticipanteEditando(undefined)
    setFormAberto(true)
  }

  function handleEditar(participante: Participante) {
    setParticipanteEditando(participante)
    setFormAberto(true)
  }

  function handleParticipanteSalvo(participante: Participante) {
    setParticipantes((prev) => {
      const idx = prev.findIndex((p) => p.id === participante.id)
      if (idx >= 0) {
        const nova = [...prev]
        nova[idx] = participante
        return nova
      }
      return [participante, ...prev]
    })
    setFormAberto(false)
    // Recarrega para ter total atualizado
    carregar()
  }

  function handleCheckin(atualizado: Participante) {
    setParticipantes((prev) =>
      prev.map((p) => (p.id === atualizado.id ? atualizado : p)),
    )
  }

  function handleAlocarSucesso() {
    setAlocarParticipante(null)
    carregar()
  }

  function handleAlocarQuartoSucesso() {
    setAlocarQuartoParticipante(null)
    carregar()
  }

  function handleRemoverParticipante() {
    carregar()
  }

  function handleImportarSucesso() {
    setImportarAberto(false)
    setPage(1)
    carregar()
  }

  // ── Exportar Excel ──────────────────────────────────────────────────────────
  async function exportarExcel() {
    if (!eventoId) return
    setExportando(true)
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/participantes.xlsx`,
        'participantes.xlsx',
      )
    } finally {
      setExportando(false)
    }
  }

  // ── Paginacao ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / LIMIT)
  const inicio = (page - 1) * LIMIT + 1
  const fim = Math.min(page * LIMIT, total)

  // ── Opcoes de equipe para filtro ────────────────────────────────────────────
  const equipeOpcoes = [
    { value: '', label: 'Todas as equipes' },
    ...equipes.map((e) => ({ value: e.id, label: e.nome })),
  ]

  const quartoOpcoes = [
    { value: '', label: 'Todos os quartos' },
    ...quartos.map((q) => ({ value: q.id, label: q.nome })),
  ]

  const totalCheckins = participantes.filter((p) => p.checkinEm).length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />
      {/* Cabecalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          Participantes
          {total > 0 && (
            <span className="ml-2 text-base font-normal text-gray-500">({total} total)</span>
          )}
          {total > 0 && (
            <span className="ml-3 text-sm font-normal text-green-600">
              {totalCheckins}/{total} fizeram check-in
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            icon={<FileExcelOutlined />}
            onClick={exportarExcel}
            loading={exportando}
          >
            Exportar Excel
          </Button>
          {podeEditar && (
            <>
              <Button
                variant="ghost"
                icon={<UploadOutlined />}
                onClick={() => setImportarAberto(true)}
              >
                Importar CSV
              </Button>
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={handleNovoParticipante}
              >
                Novo Participante
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Input
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            options={STATUS_FILTRO_OPTIONS}
            value={filtroStatus}
            onChange={(e) => handleFiltroStatus(e.target.value)}
          />
        </div>
        {equipes.length > 0 && (
          <div className="min-w-[160px]">
            <Select
              options={equipeOpcoes}
              value={filtroEquipe}
              onChange={(e) => handleFiltroEquipe(e.target.value)}
            />
          </div>
        )}
        {quartos.length > 0 && (
          <div className="min-w-[160px]">
            <Select
              options={quartoOpcoes}
              value={filtroQuarto}
              onChange={(e) => handleFiltroQuarto(e.target.value)}
            />
          </div>
        )}
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
      ) : participantes.length === 0 ? (
        <EmptyState
          title="Nenhum participante encontrado"
          description={
            busca || filtroStatus || filtroEquipe
              ? 'Tente ajustar os filtros para encontrar o que procura.'
              : 'Cadastre o primeiro participante clicando em "Novo Participante".'
          }
          action={
            podeEditar && !busca && !filtroStatus && !filtroEquipe ? (
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={handleNovoParticipante}
              >
                Novo Participante
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Tabela */}
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Equipe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Quarto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => (
                  <ParticipanteRow
                    key={p.id}
                    participante={p}
                    eventoId={eventoId ?? ''}
                    onEditar={handleEditar}
                    onAlocar={(part) => setAlocarParticipante(part)}
                    onAlocarQuarto={(part) => setAlocarQuartoParticipante(part)}
                    onRemover={handleRemoverParticipante}
                    onCheckin={handleCheckin}
                    podeEditar={podeEditar}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginacao */}
          {total > LIMIT && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Mostrando {inicio}–{fim} de {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LeftOutlined />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Próximo
                  <RightOutlined />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: criar / editar participante */}
      {formAberto && eventoId && (
        <ParticipanteForm
          eventoId={eventoId}
          participante={participanteEditando}
          onSuccess={handleParticipanteSalvo}
          onCancel={() => setFormAberto(false)}
        />
      )}

      {/* Modal: importar CSV */}
      {importarAberto && eventoId && (
        <ImportarCsvModal
          eventoId={eventoId}
          open={importarAberto}
          onClose={() => setImportarAberto(false)}
          onSuccess={handleImportarSucesso}
        />
      )}

      {/* Modal: alocar em equipe */}
      {alocarParticipante && eventoId && (
        <AlocarEquipeModal
          eventoId={eventoId}
          participanteId={alocarParticipante.id}
          equipeAtual={alocarParticipante.equipeId}
          open={Boolean(alocarParticipante)}
          onClose={() => setAlocarParticipante(null)}
          onSuccess={handleAlocarSucesso}
        />
      )}

      {/* Modal: alocar em quarto */}
      {alocarQuartoParticipante && eventoId && (
        <AlocarQuartoModal
          eventoId={eventoId}
          participanteId={alocarQuartoParticipante.id}
          participanteNome={alocarQuartoParticipante.nome}
          quartoAtual={alocarQuartoParticipante.quartoId}
          open={Boolean(alocarQuartoParticipante)}
          onClose={() => setAlocarQuartoParticipante(null)}
          onSuccess={handleAlocarQuartoSucesso}
        />
      )}
    </div>
  )
}
