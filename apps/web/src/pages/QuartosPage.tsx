import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  PlusOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Card } from '../components/ui/Card'
import { QuartoForm } from '../components/quartos/QuartoForm'
import {
  listarQuartos,
  removerQuarto,
  alocarParticipanteQuarto,
  type Quarto,
} from '../services/quartoService'
import {
  listarParticipantes,
  type Participante,
} from '../services/participanteService'
import { useAuthStore } from '../store/authStore'
import { exportarArquivo } from '../utils/exportar'

export function QuartosPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((s) => s.usuario)
  const podeEditar = usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'
  const isCoordenador = usuario?.perfil === 'coordenador'

  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [participantesSemQuarto, setParticipantesSemQuarto] = useState<Participante[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')

  // Modais
  const [formAberto, setFormAberto] = useState(false)
  const [quartoEditando, setQuartoEditando] = useState<Quarto | undefined>()
  const [adicionarAoQuartoId, setAdicionarAoQuartoId] = useState<string | null>(null)
  const [participanteSelecionadoId, setParticipanteSelecionadoId] = useState('')
  const [imprimindoId, setImprimindoId] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const [listaQuartos, respParticipantes] = await Promise.all([
        listarQuartos(eventoId),
        listarParticipantes(eventoId, { limit: 1000 }),
      ])
      setQuartos(listaQuartos)
      setParticipantesSemQuarto(
        respParticipantes.data.filter((p) => !p.quartoId && p.status !== 'cancelado'),
      )
    } catch {
      setErroMsg('Não foi possível carregar os quartos e participantes.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  function handleNovoQuarto() {
    setQuartoEditando(undefined)
    setFormAberto(true)
  }

  function handleEditarQuarto(q: Quarto) {
    setQuartoEditando(q)
    setFormAberto(true)
  }

  async function handleRemoverQuarto(q: Quarto) {
    if (!eventoId) return
    if (
      !confirm(
        `Tem certeza que deseja remover o quarto "${q.nome}"? Os participantes vinculados ficarão sem quarto.`,
      )
    ) {
      return
    }
    try {
      await removerQuarto(eventoId, q.id)
      carregarDados()
    } catch {
      alert('Erro ao remover quarto. Tente novamente.')
    }
  }

  async function handleDesalocar(participanteId: string) {
    if (!eventoId) return
    try {
      await alocarParticipanteQuarto(eventoId, participanteId, null)
      carregarDados()
    } catch {
      alert('Erro ao desalocar participante.')
    }
  }

  async function handleAdicionarParticipante(quartoId: string) {
    if (!eventoId || !participanteSelecionadoId) return
    try {
      await alocarParticipanteQuarto(eventoId, participanteSelecionadoId, quartoId)
      setAdicionarAoQuartoId(null)
      setParticipanteSelecionadoId('')
      carregarDados()
    } catch {
      alert('Erro ao adicionar participante ao quarto.')
    }
  }

  async function handleImprimirQuarto(quartoId: string, quartoNome: string) {
    if (!eventoId) return
    setImprimindoId(quartoId)
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/quartos/${quartoId}.pdf`,
        `quarto-${quartoNome.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      )
    } catch {
      alert('Erro ao gerar PDF do quarto.')
    } finally {
      setImprimindoId(null)
    }
  }

  const totalCapacidade = quartos.reduce((acc, q) => acc + q.capacidade, 0)
  const totalAlocados = quartos.reduce((acc, q) => acc + (q.participantes?.length ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HomeOutlined className="text-primary-600" />
            Quartos & Acomodações
          </h1>
          {quartos.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {quartos.length} quartos • {totalAlocados} / {totalCapacidade} vagas ocupadas
              {participantesSemQuarto.length > 0 && (
                <span className="text-amber-600 font-medium ml-2">
                  ({participantesSemQuarto.length} participantes sem quarto)
                </span>
              )}
            </p>
          )}
        </div>

        {podeEditar && (
          <Button variant="primary" icon={<PlusOutlined />} onClick={handleNovoQuarto}>
            Novo Quarto
          </Button>
        )}
      </div>

      {erroMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {erroMsg}
        </p>
      )}

      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="w-8 h-8 text-primary-600" />
        </div>
      ) : quartos.length === 0 ? (
        <EmptyState
          title="Nenhum quarto cadastrado"
          description="Crie quartos para distribuir os participantes nas acomodações do retiro/evento."
          action={
            podeEditar ? (
              <Button variant="primary" icon={<PlusOutlined />} onClick={handleNovoQuarto}>
                Criar Primeiro Quarto
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quartos.map((quarto) => {
            const participantes = quarto.participantes ?? []
            const ocupacao = participantes.length
            const lotado = ocupacao >= quarto.capacidade
            const generoBadge =
              quarto.genero === 'masculino'
                ? { label: 'Masculino', color: 'blue' as const }
                : quarto.genero === 'feminino'
                  ? { label: 'Feminino', color: 'yellow' as const }
                  : { label: 'Misto', color: 'gray' as const }

            return (
              <Card key={quarto.id} className="flex flex-col justify-between p-5 border border-gray-200 hover:shadow-sm transition-shadow">
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">{quarto.nome}</h2>
                      {quarto.localizacao && (
                        <p className="text-xs text-gray-500">{quarto.localizacao}</p>
                      )}
                    </div>
                    <Badge label={generoBadge.label} color={generoBadge.color} />
                  </div>

                  {/* Informações adicionais */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span
                      className={`font-semibold ${
                        lotado ? 'text-red-600 font-bold' : 'text-gray-700'
                      }`}
                    >
                      Ocupação: {ocupacao} / {quarto.capacidade}
                    </span>
                    {quarto.responsavelNome && (
                      <span>• Resp: {quarto.responsavelNome}</span>
                    )}
                  </div>

                  {quarto.obs && (
                    <p className="text-xs text-gray-400 italic mb-3">{quarto.obs}</p>
                  )}

                  {/* Lista de Integrantes do Quarto */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center justify-between">
                      <span>Integrantes ({ocupacao})</span>
                      {podeEditar && !lotado && (
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-800 text-xs normal-case font-medium flex items-center gap-1"
                          onClick={() => {
                            setAdicionarAoQuartoId(
                              adicionarAoQuartoId === quarto.id ? null : quarto.id,
                            )
                            setParticipanteSelecionadoId('')
                          }}
                        >
                          <PlusOutlined style={{ fontSize: 10 }} /> Adicionar
                        </button>
                      )}
                    </p>

                    {/* Inline selector para adicionar participante sem quarto */}
                    {adicionarAoQuartoId === quarto.id && (
                      <div className="mb-3 p-2.5 bg-primary-50 rounded-md border border-primary-100 space-y-2">
                        <p className="text-xs font-medium text-primary-900">
                          Selecione um participante:
                        </p>
                        {participantesSemQuarto.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            Não há participantes sem quarto disponíveis.
                          </p>
                        ) : (
                          <select
                            className="w-full text-xs rounded border border-gray-300 p-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={participanteSelecionadoId}
                            onChange={(e) => setParticipanteSelecionadoId(e.target.value)}
                          >
                            <option value="">— Selecione —</option>
                            {participantesSemQuarto.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} {p.telefone ? `(${p.telefone})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                            onClick={() => setAdicionarAoQuartoId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={!participanteSelecionadoId}
                            className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                            onClick={() => handleAdicionarParticipante(quarto.id)}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    )}

                    {participantes.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">
                        Nenhum participante alocado neste quarto.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto pr-1">
                        {participantes.map((p) => (
                          <li
                            key={p.id}
                            className="py-1.5 flex items-center justify-between text-xs group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <UserOutlined className="text-gray-400 shrink-0" />
                              <span className="font-medium text-gray-800 truncate" title={p.nome}>
                                {p.nome}
                              </span>
                              {p.checkinEm && (
                                <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">
                                  check-in
                                </span>
                              )}
                            </div>
                            {podeEditar && (
                              <button
                                type="button"
                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 p-1"
                                title="Remover do quarto"
                                onClick={() => handleDesalocar(p.id)}
                              >
                                &times;
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Ações do Quarto (Imprimir Lista / Editar / Remover) */}
                <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<PrinterOutlined />}
                    loading={imprimindoId === quarto.id}
                    onClick={() => handleImprimirQuarto(quarto.id, quarto.nome)}
                    title="Imprimir lista de ocupação do quarto"
                  >
                    Imprimir Lista
                  </Button>

                  <div className="flex items-center gap-1">
                    {podeEditar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<EditOutlined />}
                        onClick={() => handleEditarQuarto(quarto)}
                        title="Editar quarto"
                      />
                    )}
                    {isCoordenador && (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoverQuarto(quarto)}
                        title="Excluir quarto"
                      />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Quarto */}
      {formAberto && eventoId && (
        <QuartoForm
          eventoId={eventoId}
          quarto={quartoEditando}
          onSuccess={() => {
            setFormAberto(false)
            carregarDados()
          }}
          onCancel={() => setFormAberto(false)}
        />
      )}
    </div>
  )
}
