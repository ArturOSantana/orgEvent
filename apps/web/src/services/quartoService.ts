import { api } from './api'
import type { Participante } from './participanteService'

export type GeneroQuarto = 'masculino' | 'feminino' | 'misto'

export interface Quarto {
  id: string
  eventoId: string
  nome: string
  genero: GeneroQuarto
  capacidade: number
  responsavelNome?: string | null
  localizacao?: string | null
  obs?: string | null
  participantes?: Participante[]
  ocupacao?: number
  criadoEm: string
  atualizadoEm: string
}

export interface CriarQuartoPayload {
  nome: string
  genero?: GeneroQuarto
  capacidade: number
  responsavelNome?: string
  localizacao?: string
  obs?: string
}

export async function listarQuartos(eventoId: string): Promise<Quarto[]> {
  const { data } = await api.get<Quarto[]>(`/api/eventos/${eventoId}/quartos`)
  return data
}

export async function buscarQuarto(eventoId: string, id: string): Promise<Quarto> {
  const { data } = await api.get<Quarto>(`/api/eventos/${eventoId}/quartos/${id}`)
  return data
}

export async function criarQuarto(eventoId: string, payload: CriarQuartoPayload): Promise<Quarto> {
  const { data } = await api.post<Quarto>(`/api/eventos/${eventoId}/quartos`, payload)
  return data
}

export async function atualizarQuarto(
  eventoId: string,
  id: string,
  payload: Partial<CriarQuartoPayload>,
): Promise<Quarto> {
  const { data } = await api.put<Quarto>(`/api/eventos/${eventoId}/quartos/${id}`, payload)
  return data
}

export async function removerQuarto(eventoId: string, id: string): Promise<{ ok: boolean }> {
  const { data } = await api.delete<{ ok: boolean }>(`/api/eventos/${eventoId}/quartos/${id}`)
  return data
}

export async function alocarParticipanteQuarto(
  eventoId: string,
  participanteId: string,
  quartoId: string | null,
): Promise<Participante> {
  const { data } = await api.post<Participante>(`/api/eventos/${eventoId}/quartos/alocar`, {
    participanteId,
    quartoId,
  })
  return data
}
