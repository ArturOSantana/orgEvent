import { api } from './api'

export type EventoStatus = 'planejamento' | 'em_andamento' | 'concluido' | 'arquivado'

export interface Evento {
  id: string
  nome: string
  tipo: string
  descricao?: string
  dataInicio: string
  dataFim: string
  local?: string
  capacidade?: number
  status: EventoStatus
  obs?: string
  criadoEm: string
  atualizadoEm: string
}

export interface EventoColaborador {
  id: string
  nome: string
  email: string
  perfil: string
}

export interface EventoDetalhado extends Evento {
  colaboradores: EventoColaborador[]
  totalParticipantes: number
  totalEquipes: number
  totalVoluntarios: number
  totalInscricoes: number
}

export interface CriarEventoPayload {
  nome: string
  tipo: string
  descricao?: string
  dataInicio: string
  dataFim: string
  local?: string
  capacidade?: number
  obs?: string
}

export interface ListarEventosFiltros {
  status?: string
  busca?: string
  page?: number
  limit?: number
}

export interface ListarEventosResposta {
  data: Evento[]
  total: number
  page: number
  limit: number
}

export async function listarEventos(
  filtros?: ListarEventosFiltros,
): Promise<ListarEventosResposta> {
  const { data } = await api.get<ListarEventosResposta>('/api/eventos', {
    params: filtros,
  })
  return data
}

export async function buscarEvento(id: string): Promise<EventoDetalhado> {
  const { data } = await api.get<EventoDetalhado>(`/api/eventos/${id}`)
  return data
}

export async function criarEvento(payload: CriarEventoPayload): Promise<Evento> {
  const { data } = await api.post<Evento>('/api/eventos', payload)
  return data
}

export async function atualizarEvento(
  id: string,
  payload: Partial<CriarEventoPayload>,
): Promise<Evento> {
  const { data } = await api.put<Evento>(`/api/eventos/${id}`, payload)
  return data
}

export async function arquivarEvento(id: string): Promise<Evento> {
  const { data } = await api.post<Evento>(`/api/eventos/${id}/arquivar`)
  return data
}

export async function desarquivarEvento(id: string): Promise<Evento> {
  const { data } = await api.post<Evento>(`/api/eventos/${id}/desarquivar`)
  return data
}

export async function adicionarUsuario(
  eventoId: string,
  email: string,
  perfil: string,
): Promise<EventoColaborador> {
  const { data } = await api.post<EventoColaborador>(
    `/api/eventos/${eventoId}/usuarios`,
    { email, perfil },
  )
  return data
}
