import { api } from './api'

export interface Funcao {
  id: string
  eventoId: string
  nome: string
  descricao?: string
}

export interface MembroEquipe {
  id: string
  equipeId: string
  voluntarioId: string
  funcaoId?: string
  voluntario: {
    id: string
    nome: string
    telefone?: string
    email?: string
  }
  funcao?: {
    id: string
    nome: string
  }
}

export interface Equipe {
  id: string
  eventoId: string
  nome: string
  descricao?: string
  _count?: { membros: number }
  membros?: MembroEquipe[]
}

export type CriarEquipePayload = { nome: string; descricao?: string }
export type AtualizarEquipePayload = Partial<CriarEquipePayload>

export async function listarEquipes(eventoId: string): Promise<Equipe[]> {
  const { data } = await api.get<Equipe[]>(`/api/eventos/${eventoId}/equipes`)
  return data
}

export async function buscarEquipe(eventoId: string, equipeId: string): Promise<Equipe> {
  const { data } = await api.get<Equipe>(`/api/eventos/${eventoId}/equipes/${equipeId}`)
  return data
}

export async function criarEquipe(eventoId: string, payload: CriarEquipePayload): Promise<Equipe> {
  const { data } = await api.post<Equipe>(`/api/eventos/${eventoId}/equipes`, payload)
  return data
}

export async function atualizarEquipe(
  eventoId: string,
  equipeId: string,
  payload: AtualizarEquipePayload,
): Promise<Equipe> {
  const { data } = await api.put<Equipe>(
    `/api/eventos/${eventoId}/equipes/${equipeId}`,
    payload,
  )
  return data
}

export async function adicionarMembro(
  eventoId: string,
  equipeId: string,
  voluntarioId: string,
  funcaoId?: string,
): Promise<MembroEquipe> {
  const { data } = await api.post<MembroEquipe>(
    `/api/eventos/${eventoId}/equipes/${equipeId}/membros`,
    { voluntarioId, funcaoId },
  )
  return data
}

export async function removerMembro(
  eventoId: string,
  equipeId: string,
  voluntarioId: string,
): Promise<void> {
  await api.delete(
    `/api/eventos/${eventoId}/equipes/${equipeId}/membros/${voluntarioId}`,
  )
}

export async function listarFuncoes(eventoId: string): Promise<Funcao[]> {
  const { data } = await api.get<Funcao[]>(`/api/eventos/${eventoId}/equipes/funcoes`)
  return data
}

export async function criarFuncao(
  eventoId: string,
  payload: { nome: string; descricao?: string },
): Promise<Funcao> {
  const { data } = await api.post<Funcao>(
    `/api/eventos/${eventoId}/equipes/funcoes`,
    payload,
  )
  return data
}

export function exportarEscalasPdfUrl(eventoId: string): string {
  return `${api.defaults.baseURL}/api/eventos/${eventoId}/exportar/escalas.pdf`
}
