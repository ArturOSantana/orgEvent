import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  CalendarOutlined,
  EnvironmentOutlined,
  EditOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { buscarEvento, arquivarEvento, desarquivarEvento } from '../services/eventoService'
import type { EventoDetalhado } from '../services/eventoService'
import { EventoStatusBadge } from '../components/eventos/EventoStatusBadge'
import { EventoForm } from '../components/eventos/EventoForm'
import { AdicionarUsuarioModal } from '../components/eventos/AdicionarUsuarioModal'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'
import { useEventoStore } from '../store/eventoStore'

function formatarData(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const aaaa = d.getFullYear()
  const HH = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${aaaa} ${HH}:${min}`
}

const LABEL_PERFIL: Record<string, string> = {
  coordenador: 'Coordenador',
  lider_equipe: 'Lider de Equipe',
  voluntario: 'Voluntario',
  admin: 'Administrador',
  visualizador: 'Visualizador',
}

export function EventoDetailPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const setUsuario = useAuthStore((s) => s.setUsuario)
  const usuarioRef = useRef(usuario)
  useEffect(() => { usuarioRef.current = usuario }, [usuario])
  const setEventoAtivo = useEventoStore((s) => s.setEventoAtivo)

  const [evento, setEvento] = useState<EventoDetalhado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')

  const [modalEdicao, setModalEdicao] = useState(false)
  const [modalColaborador, setModalColaborador] = useState(false)
  const [modalArquivar, setModalArquivar] = useState(false)
  const [arquivando, setArquivando] = useState(false)
  const [reativando, setReativando] = useState(false)

  const isCoordenador =
    usuario?.perfil === 'coordenador' || usuario?.perfil === 'admin'

  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const dados = await buscarEvento(eventoId)
      setEvento(dados)
      setEventoAtivo({ id: dados.id, nome: dados.nome })

      // Atualizar o perfil do usuario logado para este evento
      // O perfil e por evento (evento_usuarios), nao global
      const u = usuarioRef.current
      if (u) {
        const colaborador = dados.colaboradores.find((c) => c.id === u.id)
        if (colaborador) {
          setUsuario({ ...u, perfil: colaborador.perfil })
        }
      }
    } catch {
      setErroMsg('Não foi possível carregar o evento. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId, setEventoAtivo, setUsuario])

  useEffect(() => {
    carregar()
    return () => {
      setEventoAtivo(null)
    }
  }, [carregar, setEventoAtivo])

  async function handleArquivar() {
    if (!eventoId) return
    setArquivando(true)
    try {
      const atualizado = await arquivarEvento(eventoId)
      setEvento((prev) => (prev ? { ...prev, status: atualizado.status } : prev))
      setModalArquivar(false)
    } catch {
      alert('Não foi possível arquivar o evento. Tente novamente.')
    } finally {
      setArquivando(false)
    }
  }

  async function handleReativar() {
    if (!eventoId) return
    setReativando(true)
    try {
      const atualizado = await desarquivarEvento(eventoId)
      setEvento((prev) => (prev ? { ...prev, status: atualizado.status } : prev))
    } catch {
      alert('Não foi possível reativar o evento. Tente novamente.')
    } finally {
      setReativando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="w-8 h-8 text-primary-600" />
      </div>
    )
  }

  if (erroMsg || !evento) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <ExclamationCircleOutlined className="text-4xl text-red-400" />
        <p className="text-sm text-gray-700">{erroMsg || 'Evento nao encontrado.'}</p>
        <Button variant="ghost" onClick={() => navigate('/eventos')}>
          Voltar para Eventos
        </Button>
      </div>
    )
  }

  const tabs = [
    { label: 'Visão Geral', path: `/eventos/${eventoId}/visao-geral` },
    { label: 'Cronograma', path: `/eventos/${eventoId}/cronograma` },
    { label: 'Equipes', path: `/eventos/${eventoId}/equipes` },
    { label: 'Voluntários', path: `/eventos/${eventoId}/voluntarios` },
    { label: 'Participantes', path: `/eventos/${eventoId}/participantes` },
    { label: 'Materiais', path: `/eventos/${eventoId}/materiais` },
    { label: 'Inscrições', path: `/eventos/${eventoId}/inscricoes` },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecalho do evento */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{evento.nome}</h1>
              <EventoStatusBadge status={evento.status} />
            </div>

            <p className="text-sm text-gray-500">{evento.tipo}</p>

            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <CalendarOutlined className="text-gray-400 shrink-0" />
                <span>
                  {formatarData(evento.dataInicio)} — {formatarData(evento.dataFim)}
                </span>
              </div>
              {evento.local && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <EnvironmentOutlined className="text-gray-400 shrink-0" />
                  <span>{evento.local}</span>
                </div>
              )}
            </div>
          </div>

          {/* Acoes do cabecalho */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isCoordenador && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FormOutlined />}
                    onClick={() => navigate(`/eventos/${eventoId}/formulario`)}
                  >
                    Formulário
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<EditOutlined />}
                    onClick={() => setModalEdicao(true)}
                  >
                    Editar
                  </Button>
                  {evento.status === 'arquivado' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={reativando}
                      onClick={handleReativar}
                    >
                      Reativar evento
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setModalArquivar(true)}
                    >
                      Arquivar evento
                    </Button>
                  )}
                </>
              )}
          </div>
        </div>
      </div>

      {/* Tabs de navegacao */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <nav className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                [
                  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-primary-600 text-primary-700 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ].join(' ')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Conteúdo da aba ativa */}
      <Outlet context={evento} />

      {/* Secao de colaboradores */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Colaboradores</h2>
          {isCoordenador && (
            <Button
              variant="secondary"
              size="sm"
              icon={<UserAddOutlined />}
              onClick={() => setModalColaborador(true)}
            >
              Adicionar colaborador
            </Button>
          )}
        </div>

        {evento.colaboradores.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum colaborador adicionado.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {evento.colaboradores.map((col) => (
              <li key={col.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{col.nome}</p>
                  <p className="text-xs text-gray-500">{col.email}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  {LABEL_PERFIL[col.perfil] ?? col.perfil}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de edicao */}
      <Modal
        open={modalEdicao}
        onClose={() => setModalEdicao(false)}
        title="Editar Evento"
      >
        <EventoForm
          evento={evento}
          onSuccess={(atualizado) => {
            setEvento((prev) =>
              prev ? { ...prev, ...atualizado } : prev,
            )
            setModalEdicao(false)
          }}
          onCancel={() => setModalEdicao(false)}
        />
      </Modal>

      {/* Modal de adicionar colaborador */}
      {eventoId && (
        <AdicionarUsuarioModal
          eventoId={eventoId}
          open={modalColaborador}
          onClose={() => {
            setModalColaborador(false)
            // Recarrega para refletir o novo colaborador
            carregar()
          }}
        />
      )}

      {/* Modal de confirmacao de arquivamento */}
      <Modal
        open={modalArquivar}
        onClose={() => setModalArquivar(false)}
        title="Arquivar evento"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalArquivar(false)}
              disabled={arquivando}
            >
              Cancelar
            </Button>
            <Button variant="danger" loading={arquivando} onClick={handleArquivar}>
              Arquivar
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Tem certeza que deseja arquivar o evento{' '}
          <strong>{evento.nome}</strong>? Esta acao pode ser revertida
          alterando o status manualmente.
        </p>
      </Modal>
    </div>
  )
}
