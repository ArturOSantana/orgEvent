import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import {
  listarInscricoes,
  confirmarPagamento,
  confirmarInscricao,
  cancelarInscricao,
  checkinInscricao,
  type Inscricao,
  type InscricaoStatus,
} from '../services/inscricaoService'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuthStore } from '../store/authStore'
import { useDebounce } from '../hooks/useDebounce'
import { api } from '../services/api'
import type { BadgeColor } from '../components/ui/Badge'

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente_pagamento', label: 'Aguardando pagamento' },
  { value: 'pago', label: 'Pagamento confirmado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const STATUS_LABEL: Record<InscricaoStatus, string> = {
  pendente_pagamento: 'Aguard. pagamento',
  pago: 'Pago',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<InscricaoStatus, BadgeColor> = {
  pendente_pagamento: 'yellow',
  pago: 'blue',
  confirmado: 'green',
  cancelado: 'red',
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Contadores reais vindos da API (total de cada status no banco)
interface Totais {
  pendente_pagamento: number
  pago: number
  confirmado: number
  checkin: number
  total: number
}

export function InscricoesPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((s) => s.usuario)
  const podeGerenciar =
    usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'

  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [total, setTotal] = useState(0)
  const [totais, setTotais] = useState<Totais | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoTotais, setCarregandoTotais] = useState(true)
  const [erroMsg, setErroMsg] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebounce(busca, 350)
  const [page, setPage] = useState(1)
  const [acaoId, setAcaoId] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  // Carrega os totais reais de cada status em paralelo
  const carregarTotais = useCallback(async () => {
    if (!eventoId) return
    setCarregandoTotais(true)
    try {
      const [rTotal, rPendente, rPago, rConfirmado, rCheckin] = await Promise.all([
        listarInscricoes(eventoId, { limit: 1 }),
        listarInscricoes(eventoId, { status: 'pendente_pagamento', limit: 1 }),
        listarInscricoes(eventoId, { status: 'pago', limit: 1 }),
        listarInscricoes(eventoId, { status: 'confirmado', limit: 1 }),
        // checkin: filtramos confirmados com checkinEm preenchido via lista maior
        listarInscricoes(eventoId, { status: 'confirmado', limit: 1000 }),
      ])
      setTotais({
        total: rTotal.total,
        pendente_pagamento: rPendente.total,
        pago: rPago.total,
        confirmado: rConfirmado.total,
        checkin: rCheckin.data.filter((i) => i.checkinEm).length,
      })
    } catch {
      // silencia — os cards ficam sem dados
    } finally {
      setCarregandoTotais(false)
    }
  }, [eventoId])

  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const resp = await listarInscricoes(eventoId, {
        status: filtroStatus || undefined,
        busca: buscaDebounced || undefined,
        page,
        limit: LIMIT,
      })
      setInscricoes(resp.data)
      setTotal(resp.total)
    } catch {
      setErroMsg('Não foi possível carregar as inscrições.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId, filtroStatus, buscaDebounced, page])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Carrega totais uma vez na montagem e após qualquer ação
  useEffect(() => {
    carregarTotais()
  }, [carregarTotais])

  function handleFiltroStatus(v: string) {
    setFiltroStatus(v)
    setPage(1)
  }

  function handleBusca(v: string) {
    setBusca(v)
    setPage(1)
  }

  async function handleAcao(
    id: string,
    acao: 'confirmar-pagamento' | 'confirmar' | 'cancelar' | 'checkin',
  ) {
    if (!eventoId) return
    setAcaoId(id)
    try {
      let atualizado: Inscricao
      if (acao === 'confirmar-pagamento') atualizado = await confirmarPagamento(eventoId, id)
      else if (acao === 'confirmar') atualizado = await confirmarInscricao(eventoId, id)
      else if (acao === 'cancelar') atualizado = await cancelarInscricao(eventoId, id)
      else atualizado = await checkinInscricao(eventoId, id)
      setInscricoes((prev) => prev.map((i) => (i.id === atualizado.id ? atualizado : i)))
      // Atualiza contadores
      carregarTotais()
    } catch {
      alert('Não foi possível executar a ação. Tente novamente.')
    } finally {
      setAcaoId(null)
    }
  }

  async function handleExportar() {
    if (!eventoId) return
    setExportando(true)
    try {
      const resp = await api.get(`/api/eventos/${eventoId}/exportar/inscricoes.xlsx`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([resp.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'inscricoes.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível exportar. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)
  const inicio = (page - 1) * LIMIT + 1
  const fim = Math.min(page * LIMIT, total)

  return (
    <div className="flex flex-col gap-6 pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          Inscrições
          {(totais?.total ?? total) > 0 && (
            <span className="ml-2 text-base font-normal text-gray-500">
              ({totais?.total ?? total} total)
            </span>
          )}
        </h1>
        {podeGerenciar && (
          <Button
            variant="secondary"
            size="sm"
            icon={<DownloadOutlined />}
            loading={exportando}
            onClick={handleExportar}
          >
            Exportar XLSX
          </Button>
        )}
      </div>

      {/* Cards de resumo — contadores reais do banco */}
      {!carregandoTotais && totais && totais.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Aguard. pagamento',
              valor: totais.pendente_pagamento,
              cor: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            },
            {
              label: 'Pagamento confirmado',
              valor: totais.pago,
              cor: 'bg-blue-50 border-blue-200 text-blue-700',
            },
            {
              label: 'Confirmados',
              valor: totais.confirmado,
              cor: 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Com check-in',
              valor: totais.checkin,
              cor: 'bg-purple-50 border-purple-200 text-purple-700',
            },
          ].map(({ label, valor, cor }) => (
            <div key={label} className={`rounded-lg border p-3 text-center ${cor}`}>
              <p className="text-2xl font-bold leading-none">{valor}</p>
              <p className="text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Busca por nome */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
          />
        </div>

        {/* Filtro de status */}
        <select
          className="block rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
          value={filtroStatus}
          onChange={(e) => handleFiltroStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Erro */}
      {erroMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {erroMsg}
        </p>
      )}

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="w-8 h-8 text-primary-600" />
        </div>
      ) : inscricoes.length === 0 ? (
        <EmptyState
          title="Nenhuma inscrição encontrada"
          description={
            filtroStatus || busca
              ? 'Tente alterar os filtros.'
              : 'As inscrições aparecerão aqui após alguém preencher o formulário público.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Inscrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Check-in
                  </th>
                  {podeGerenciar && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((insc) => (
                  <tr
                    key={insc.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{insc.nome}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{insc.email ?? '—'}</div>
                      {insc.telefone && (
                        <div className="text-xs text-gray-400">{insc.telefone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatarData(insc.criadoEm)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={STATUS_LABEL[insc.status]}
                        color={STATUS_COLOR[insc.status]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {insc.checkinEm ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircleOutlined />
                          {formatarData(insc.checkinEm)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {insc.status === 'pendente_pagamento' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={acaoId === insc.id}
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleAcao(insc.id, 'confirmar-pagamento')}
                            >
                              Confirmar pag.
                            </Button>
                          )}
                          {insc.status === 'pago' && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={acaoId === insc.id}
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleAcao(insc.id, 'confirmar')}
                            >
                              Confirmar
                            </Button>
                          )}
                          {insc.status === 'confirmado' && !insc.checkinEm && (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={acaoId === insc.id}
                              icon={<ClockCircleOutlined />}
                              onClick={() => handleAcao(insc.id, 'checkin')}
                            >
                              Check-in
                            </Button>
                          )}
                          {insc.status !== 'cancelado' && (
                            <Button
                              variant="danger"
                              size="sm"
                              loading={acaoId === insc.id}
                              icon={<CloseCircleOutlined />}
                              onClick={() => {
                                if (confirm(`Cancelar inscrição de ${insc.nome}?`))
                                  handleAcao(insc.id, 'cancelar')
                              }}
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo <RightOutlined />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
