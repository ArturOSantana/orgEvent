import { api } from './api'

export type ParticipanteStatus = 'confirmado' | 'pendente' | 'cancelado'

export interface Participante {
  id: string
  eventoId: string
  nome: string
  telefone?: string
  email?: string
  obs?: string
  status: ParticipanteStatus
  equipeId?: string
  equipe?: { id: string; nome: string }
  checkinEm?: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface CriarParticipantePayload {
  nome: string
  telefone?: string
  email?: string
  obs?: string
  status?: ParticipanteStatus
}

export interface ListarParticipantesFiltros {
  busca?: string
  equipeId?: string
  status?: string
  page?: number
  limit?: number
}

export interface ListarParticipantesResposta {
  data: Participante[]
  total: number
  page: number
  limit: number
}

export async function listarParticipantes(
  eventoId: string,
  filtros?: ListarParticipantesFiltros,
): Promise<ListarParticipantesResposta> {
  const { data } = await api.get<ListarParticipantesResposta>(
    `/api/eventos/${eventoId}/participantes`,
    { params: filtros },
  )
  return data
}

export async function buscarParticipante(eventoId: string, id: string): Promise<Participante> {
  const { data } = await api.get<Participante>(`/api/eventos/${eventoId}/participantes/${id}`)
  return data
}

export async function criarParticipante(
  eventoId: string,
  dados: CriarParticipantePayload,
): Promise<Participante> {
  const { data } = await api.post<Participante>(`/api/eventos/${eventoId}/participantes`, dados)
  return data
}

export async function atualizarParticipante(
  eventoId: string,
  id: string,
  dados: Partial<CriarParticipantePayload>,
): Promise<Participante> {
  const { data } = await api.put<Participante>(
    `/api/eventos/${eventoId}/participantes/${id}`,
    dados,
  )
  return data
}

export async function alocarEquipe(
  eventoId: string,
  id: string,
  equipeId: string,
): Promise<Participante> {
  const { data } = await api.post<Participante>(
    `/api/eventos/${eventoId}/participantes/${id}/equipe`,
    { equipeId },
  )
  return data
}

export async function fazerCheckin(eventoId: string, id: string): Promise<Participante> {
  const { data } = await api.post<Participante>(
    `/api/eventos/${eventoId}/participantes/${id}/checkin`,
  )
  return data
}

export async function importarCsv(
  eventoId: string,
  participantes: CriarParticipantePayload[],
): Promise<{ importados: number }> {
  const { data } = await api.post<{ importados: number }>(
    `/api/eventos/${eventoId}/participantes/importar`,
    { participantes },
  )
  return data
}
