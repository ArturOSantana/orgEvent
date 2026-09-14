import { api } from './api'

export type InscricaoStatus =
  | 'pendente_pagamento'
  | 'pago'
  | 'confirmado'
  | 'cancelado'

export type TipoCampo = 'texto' | 'textarea' | 'select' | 'checkbox'

export interface CampoFormulario {
  id: string
  formularioId: string
  rotulo: string
  tipo: TipoCampo
  opcoes?: string[]
  obrigatorio: boolean
  ordem: number
}

export interface FormularioInscricao {
  id: string
  eventoId: string
  slug: string
  titulo: string
  descricao?: string
  coletarTelefone: boolean
  coletarEmail: boolean
  valorInscricao?: string | null
  instrucoesPagamento?: string | null
  ativo: boolean
  dataLimite?: string | null
  vagas?: number | null
  campos: CampoFormulario[]
  criadoEm: string
  atualizadoEm: string
}

export interface Inscricao {
  id: string
  formularioId: string
  eventoId: string
  nome: string
  email?: string | null
  telefone?: string | null
  status: InscricaoStatus
  pagamentoConfirmadoPor?: string | null
  pagamentoConfirmadoEm?: string | null
  checkinEm?: string | null
  obsAdmin?: string | null
  criadoEm: string
  atualizadoEm: string
  respostas?: Array<{ campoId: string; rotulo: string; valor: string | null }>
}

export interface InscricaoComInstrucoes extends Inscricao {
  instrucoesPagamento?: string | null
}

export interface ListarInscricoesResposta {
  data: Inscricao[]
  total: number
  page: number
  limit: number
}

export interface SalvarFormularioPayload {
  titulo: string
  descricao?: string
  coletarTelefone?: boolean
  coletarEmail?: boolean
  valorInscricao?: string
  instrucoesPagamento?: string
  ativo?: boolean
  dataLimite?: string | null
  vagas?: number | null
  campos?: Array<{
    rotulo: string
    tipo: TipoCampo
    opcoes?: string[]
    obrigatorio: boolean
    ordem: number
  }>
}

export interface InscricaoPublicaPayload {
  nome: string
  email?: string
  telefone?: string
  respostas?: Array<{ campoId: string; valor: string }>
}

// ── Admin: formulário ─────────────────────────────────────────────────────────

export async function obterFormulario(eventoId: string): Promise<FormularioInscricao | null> {
  const { data } = await api.get<FormularioInscricao | null>(
    `/api/eventos/${eventoId}/formulario`,
  )
  return data
}

export async function salvarFormulario(
  eventoId: string,
  payload: SalvarFormularioPayload,
): Promise<FormularioInscricao> {
  const { data } = await api.put<FormularioInscricao>(
    `/api/eventos/${eventoId}/formulario`,
    payload,
  )
  return data
}

export async function alternarAtivo(eventoId: string, ativo: boolean): Promise<void> {
  await api.patch(`/api/eventos/${eventoId}/formulario/ativo`, { ativo })
}

// ── Admin: inscrições ─────────────────────────────────────────────────────────

export async function listarInscricoes(
  eventoId: string,
  filtros?: { status?: string; busca?: string; page?: number; limit?: number },
): Promise<ListarInscricoesResposta> {
  const { data } = await api.get<ListarInscricoesResposta>(
    `/api/eventos/${eventoId}/formulario/inscricoes`,
    { params: filtros },
  )
  return data
}

export async function buscarInscricao(eventoId: string, id: string): Promise<Inscricao> {
  const { data } = await api.get<Inscricao>(
    `/api/eventos/${eventoId}/formulario/inscricoes/${id}`,
  )
  return data
}

export async function confirmarPagamento(eventoId: string, id: string): Promise<Inscricao> {
  const { data } = await api.post<Inscricao>(
    `/api/eventos/${eventoId}/formulario/inscricoes/${id}/confirmar-pagamento`,
  )
  return data
}

export async function confirmarInscricao(eventoId: string, id: string): Promise<Inscricao> {
  const { data } = await api.post<Inscricao>(
    `/api/eventos/${eventoId}/formulario/inscricoes/${id}/confirmar`,
  )
  return data
}

export async function cancelarInscricao(eventoId: string, id: string): Promise<Inscricao> {
  const { data } = await api.post<Inscricao>(
    `/api/eventos/${eventoId}/formulario/inscricoes/${id}/cancelar`,
  )
  return data
}

export async function checkinInscricao(eventoId: string, id: string): Promise<Inscricao> {
  const { data } = await api.post<Inscricao>(
    `/api/eventos/${eventoId}/formulario/inscricoes/${id}/checkin`,
  )
  return data
}

// ── Público: inscrição via slug ───────────────────────────────────────────────

export async function obterFormularioPublico(
  slug: string,
): Promise<Omit<FormularioInscricao, 'instrucoesPagamento'>> {
  const { data } = await api.get(`/api/inscricao/${slug}`)
  return data
}

export async function inscrever(
  slug: string,
  payload: InscricaoPublicaPayload,
): Promise<InscricaoComInstrucoes> {
  const { data } = await api.post<InscricaoComInstrucoes>(`/api/inscricao/${slug}`, payload)
  return data
}
