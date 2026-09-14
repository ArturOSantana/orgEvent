import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  WarningOutlined,
  MessageOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { DashboardCard } from '../components/dashboard/DashboardCard'
import { ProximosHorarios } from '../components/dashboard/ProximosHorarios'
import { StatusMateriais } from '../components/dashboard/StatusMateriais'
import { listarMateriais, listarObservacoes } from '../services/materialService'
import type { Observacao } from '../services/materialService'
import type { EventoDetalhado } from '../services/eventoService'
import { Spinner } from '../components/ui/Spinner'

function formatarDataHora(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${HH}:${min}`
}

export function EventoDashboardPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const navigate = useNavigate()
  const evento = useOutletContext<EventoDetalhado>()

  const [materiaisPendentes, setMateriaisPendentes] = useState<number | null>(null)
  const [observacoes, setObservacoes] = useState<Observacao[]>([])
  const [carregandoExtras, setCarregandoExtras] = useState(true)

  useEffect(() => {
    if (!eventoId) return
    let cancelado = false

    async function carregarExtras() {
      setCarregandoExtras(true)
      try {
        const [materiaisResp, obsResp] = await Promise.all([
          listarMateriais(eventoId!, { status: 'pendente', limit: 1000 }),
          listarObservacoes(eventoId!),
        ])
        if (cancelado) return
        setMateriaisPendentes(materiaisResp.total)
        // Ordena por mais recente e pega as 2 últimas
        const ordenadas = [...obsResp].sort(
          (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
        )
        setObservacoes(ordenadas.slice(0, 2))
      } catch {
        // silencia
      } finally {
        if (!cancelado) setCarregandoExtras(false)
      }
    }

    carregarExtras()
    return () => {
      cancelado = true
    }
  }, [eventoId])

  if (!evento) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Grid de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashboardCard
          titulo="Participantes"
          valor={evento.totalParticipantes}
          icon={<UserOutlined />}
          cor="blue"
          onClick={() => navigate(`/eventos/${eventoId}/participantes`)}
        />
        <DashboardCard
          titulo="Equipes"
          valor={evento.totalEquipes}
          icon={<TeamOutlined />}
          cor="green"
          onClick={() => navigate(`/eventos/${eventoId}/equipes`)}
        />
        <DashboardCard
          titulo="Voluntários"
          valor={evento.totalVoluntarios}
          icon={<AppstoreOutlined />}
          cor="yellow"
          onClick={() => navigate(`/eventos/${eventoId}/voluntarios`)}
        />
        <DashboardCard
          titulo="Materiais Pendentes"
          valor={materiaisPendentes ?? '—'}
          icon={<WarningOutlined />}
          cor="red"
          onClick={() => navigate(`/eventos/${eventoId}/materiais`)}
        />
      </div>

      {/* Card de inscrições */}
      <div
        role="button"
        tabIndex={0}
        className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
        onClick={() => navigate(`/eventos/${eventoId}/inscricoes`)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/eventos/${eventoId}/inscricoes`)}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 shrink-0">
          <FormOutlined className="text-xl" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{evento.totalInscricoes}</p>
          <p className="text-xs text-gray-500 mt-0.5">Inscrições ativas</p>
        </div>
        <span className="ml-auto text-xs text-primary-600 font-medium">Ver todas →</span>
      </div>

      {/* Linha inferior: próximos horários + status materiais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <ProximosHorarios eventoId={eventoId!} />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <StatusMateriais eventoId={eventoId!} />
        </div>
      </div>

      {/* Observações rápidas */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageOutlined className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800">Observações Recentes</h3>
          </div>
          <button
            type="button"
            className="text-xs text-primary-600 hover:underline"
            onClick={() => navigate(`/eventos/${eventoId}/materiais`)}
          >
            Ver todas
          </button>
        </div>

        {carregandoExtras ? (
          <div className="flex justify-center py-4">
            <Spinner className="w-5 h-5 text-primary-600" />
          </div>
        ) : observacoes.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma observação registrada.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {observacoes.map((obs) => (
              <li key={obs.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-800 whitespace-pre-line">{obs.conteudo}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {obs.autor && (
                    <span className="text-xs text-gray-400">{obs.autor.nome}</span>
                  )}
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{formatarDataHora(obs.criadoEm)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
