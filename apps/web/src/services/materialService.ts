import { api } from './api'

export type MaterialStatus = 'pendente' | 'adquirido' | 'entregue'

export interface Material {
  id: string
  eventoId: string
  nome: string
  quantidade: number
  unidade?: string
  responsavelId?: string
  responsavel?: { id: string; nome: string }
  status: MaterialStatus
  obs?: string
  criadoEm: string
  atualizadoEm: string
}

export interface Observacao {
  id: string
  eventoId: string
  conteudo: string
  autorId: string
  autor?: { id: string; nome: string }
  criadoEm: string
  atualizadoEm: string
}

export interface CriarMaterialPayload {
  nome: string
  quantidade: number
  unidade?: string
  responsavelId?: string
  status?: MaterialStatus
  obs?: string
}

export interface ListarMateriaisFiltros {
  status?: string
  busca?: string
  page?: number
  limit?: number
}

export interface ListarMateriaisResposta {
  data: Material[]
  total: number
  page: number
  limit: number
}

export async function listarMateriais(
  eventoId: string,
  filtros?: ListarMateriaisFiltros,
): Promise<ListarMateriaisResposta> {
  const { data } = await api.get<ListarMateriaisResposta>(
    `/api/eventos/${eventoId}/materiais`,
    { params: filtros },
  )
  return data
}

export async function criarMaterial(
  eventoId: string,
  dados: CriarMaterialPayload,
): Promise<Material> {
  const { data } = await api.post<Material>(`/api/eventos/${eventoId}/materiais`, dados)
  return data
}

export async function atualizarMaterial(
  eventoId: string,
  id: string,
  dados: Partial<CriarMaterialPayload>,
): Promise<Material> {
  const { data } = await api.put<Material>(
    `/api/eventos/${eventoId}/materiais/${id}`,
    dados,
  )
  return data
}

export async function listarObservacoes(eventoId: string): Promise<Observacao[]> {
  const { data } = await api.get<Observacao[]>(`/api/eventos/${eventoId}/materiais/observacoes`)
  return data
}

export async function criarObservacao(eventoId: string, conteudo: string): Promise<Observacao> {
  const { data } = await api.post<Observacao>(
    `/api/eventos/${eventoId}/materiais/observacoes`,
    { conteudo },
  )
  return data
}

export async function atualizarObservacao(
  eventoId: string,
  id: string,
  conteudo: string,
): Promise<Observacao> {
  const { data } = await api.put<Observacao>(
    `/api/eventos/${eventoId}/materiais/observacoes/${id}`,
    { conteudo },
  )
  return data
}
