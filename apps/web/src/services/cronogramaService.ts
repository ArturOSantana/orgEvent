import { api } from './api'

export interface Fase {
  id: string
  eventoId: string
  nome: string
  descricao?: string
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export interface Horario {
  id: string
  eventoId: string
  faseId?: string
  titulo: string
  descricao?: string
  data: string
  horaInicio: string
  horaFim: string
  local?: string
  responsavelId?: string
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export type CriarFasePayload = Omit<Fase, 'id' | 'eventoId' | 'criadoEm' | 'atualizadoEm'>
export type AtualizarFasePayload = Partial<CriarFasePayload>

export type CriarHorarioPayload = Omit<Horario, 'id' | 'eventoId' | 'criadoEm' | 'atualizadoEm'>
export type AtualizarHorarioPayload = Partial<CriarHorarioPayload>

export async function listarFases(eventoId: string): Promise<Fase[]> {
  const { data } = await api.get<Fase[]>(`/api/eventos/${eventoId}/cronograma/fases`)
  return data
}

export async function criarFase(
  eventoId: string,
  payload: CriarFasePayload,
): Promise<Fase> {
  const { data } = await api.post<Fase>(
    `/api/eventos/${eventoId}/cronograma/fases`,
    payload,
  )
  return data
}

export async function atualizarFase(
  eventoId: string,
  faseId: string,
  payload: AtualizarFasePayload,
): Promise<Fase> {
  const { data } = await api.put<Fase>(
    `/api/eventos/${eventoId}/cronograma/fases/${faseId}`,
    payload,
  )
  return data
}

export async function listarHorarios(
  eventoId: string,
  faseId?: string,
): Promise<Horario[]> {
  const { data } = await api.get<Horario[]>(
    `/api/eventos/${eventoId}/cronograma/horarios`,
    { params: faseId ? { faseId } : undefined },
  )
  return data
}

export async function criarHorario(
  eventoId: string,
  payload: CriarHorarioPayload,
): Promise<Horario> {
  const { data } = await api.post<Horario>(
    `/api/eventos/${eventoId}/cronograma/horarios`,
    payload,
  )
  return data
}

export async function atualizarHorario(
  eventoId: string,
  horarioId: string,
  payload: AtualizarHorarioPayload,
): Promise<Horario> {
  const { data } = await api.put<Horario>(
    `/api/eventos/${eventoId}/cronograma/horarios/${horarioId}`,
    payload,
  )
  return data
}

export async function removerHorario(
  eventoId: string,
  horarioId: string,
): Promise<void> {
  await api.delete(`/api/eventos/${eventoId}/cronograma/horarios/${horarioId}`)
}
