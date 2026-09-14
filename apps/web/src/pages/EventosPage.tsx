import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { listarEventos, desarquivarEvento } from '../services/eventoService'
import type { Evento } from '../services/eventoService'
import { EventoCard } from '../components/eventos/EventoCard'
import { EventoForm } from '../components/eventos/EventoForm'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'arquivado', label: 'Arquivado' },
]

export function EventosPage() {
  const navigate = useNavigate()

  const [eventos, setEventos] = useState<Evento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  // Ref para o timer de debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function carregar(buscaAtual: string, statusAtual: string) {
    setCarregando(true)
    setErroMsg('')
    try {
      const resposta = await listarEventos({
        busca: buscaAtual || undefined,
        status: statusAtual || undefined,
      })
      setEventos(resposta.data)
    } catch {
      setErroMsg('Não foi possível carregar os eventos. Tente novamente.')
      setEventos([])
    } finally {
      setCarregando(false)
    }
  }

  // Carregamento inicial
  useEffect(() => {
    carregar('', '')
  }, [])

  function handleBuscaChange(valor: string) {
    setBusca(valor)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      carregar(valor, status)
    }, 300)
  }

  function handleStatusChange(valor: string) {
    setStatus(valor)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      carregar(busca, valor)
    }, 300)
  }

  function handleEventoCriado(evento: Evento) {
    setModalAberto(false)
    // Navega direto para o detalhe do evento recem criado
    navigate(`/eventos/${evento.id}`)
  }

  async function handleReativar(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const atualizado = await desarquivarEvento(id)
      setEventos((prev) => prev.map((ev) => (ev.id === atualizado.id ? atualizado : ev)))
    } catch {
      alert('Não foi possível reativar o evento. Tente novamente.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecalho da pagina */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Eventos</h1>
        <Button
          variant="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalAberto(true)}
        >
          Novo Evento
        </Button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchOutlined />
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
            placeholder="Buscar por nome..."
            className="block w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
          />
        </div>
        <div className="sm:w-52">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          />
        </div>
      </div>

      {/* Mensagem de erro */}
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
      ) : eventos.length === 0 ? (
        <EmptyState
          title="Nenhum evento encontrado"
          description={
            busca || status
              ? 'Tente ajustar os filtros de busca.'
              : 'Crie o primeiro evento clicando em "Novo Evento".'
          }
          action={
            !busca && !status ? (
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalAberto(true)}
              >
                Novo Evento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {eventos.map((ev) => (
            <div key={ev.id} className="relative">
              <EventoCard
                evento={ev}
                onClick={() => navigate(`/eventos/${ev.id}`)}
              />
              {ev.status === 'arquivado' && (
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={(e) => handleReativar(ev.id, e)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800 bg-white border border-primary-200 rounded px-2 py-1 transition-colors"
                  >
                    Reativar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de criacao */}
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo Evento"
      >
        <EventoForm
          onSuccess={handleEventoCriado}
          onCancel={() => setModalAberto(false)}
        />
      </Modal>
    </div>
  )
}
