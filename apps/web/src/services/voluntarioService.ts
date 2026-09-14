import { api } from './api'
import axios from 'axios'

export interface Voluntario {
  id: string
  nome: string
  telefone?: string
  email?: string
  obs?: string
  slug?: string | null
  statusConvite?: string | null
  observacaoConvite?: string | null
  dataResposta?: string | null
  visualizadoEm?: string | null
  tituloConvite?: string | null
  mensagemConvite?: string | null
  arteUrl?: string | null
  equipeId?: string | null
  funcaoId?: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface ConvitePublico {
  id: string
  nome: string
  slug: string
  statusConvite: string
  observacaoConvite: string | null
  dataResposta: string | null
  visualizadoEm: string | null
  equipeNome: string | null
  funcaoNome: string | null
  eventoId: string | null
  eventoNome: string | null
  eventoDataInicio: string | null
  eventoDataFim: string | null
  eventoLocal: string | null
  tituloConvite: string | null
  mensagemConvite: string | null
  arteUrl: string | null
}

export interface ListarVoluntariosFiltros {
  busca?: string
  page?: number
  limit?: number
}

export type CriarVoluntarioPayload = {
  nome: string
  email?: string
  telefone?: string
  obs?: string
  tituloConvite?: string | null
  mensagemConvite?: string | null
  arteUrl?: string | null
  equipeId?: string | null
  funcaoId?: string | null
}

export type AtualizarVoluntarioPayload = Partial<CriarVoluntarioPayload>

export async function listarVoluntarios(
  eventoId: string,
  filtros?: ListarVoluntariosFiltros,
): Promise<Voluntario[]> {
  const { data } = await api.get<Voluntario[]>(`/api/eventos/${eventoId}/voluntarios`, {
    params: filtros,
  })
  return data
}

export async function criarVoluntario(
  eventoId: string,
  payload: CriarVoluntarioPayload,
): Promise<Voluntario> {
  const { data } = await api.post<Voluntario>(
    `/api/eventos/${eventoId}/voluntarios`,
    payload,
  )
  return data
}

export async function atualizarVoluntario(
  eventoId: string,
  id: string,
  payload: AtualizarVoluntarioPayload,
): Promise<Voluntario> {
  const { data } = await api.put<Voluntario>(
    `/api/eventos/${eventoId}/voluntarios/${id}`,
    payload,
  )
  return data
}

export async function removerVoluntario(eventoId: string, id: string): Promise<void> {
  await api.delete(`/api/eventos/${eventoId}/voluntarios/${id}`)
}

export async function gerarConvite(
  eventoId: string,
  voluntarioId: string,
): Promise<{ slug: string }> {
  const { data } = await api.post<{ slug: string }>(
    `/api/eventos/${eventoId}/voluntarios/${voluntarioId}/convite`,
  )
  return data
}

// Busca convite público — sem token de autenticação
const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:3001')

export async function buscarConvitePublico(slug: string): Promise<ConvitePublico> {
  const { data } = await axios.get<ConvitePublico>(`${apiBase}/api/convites/${slug}`)
  return data
}

export async function responderConvite(
  slug: string,
  status: 'aceito' | 'recusado',
  observacao: string,
): Promise<{ success: boolean; convite: ConvitePublico }> {
  const { data } = await axios.post<{ success: boolean; convite: ConvitePublico }>(
    `${apiBase}/api/convites/${slug}/responder`,
    { status, observacao },
  )
  return data
}
