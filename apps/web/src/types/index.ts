/**
 * Tipos locais do frontend — complementares aos tipos compartilhados de @retirojovens/types.
 * Tipos de domínio completos serão expandidos em ST-09 a ST-14.
 */

export type Perfil = 'admin' | 'coordenador' | 'voluntario' | 'visualizador'

export interface UsuarioLocal {
  id: string
  nome: string
  email: string
  perfil: Perfil
}

export interface EventoResumo {
  id: string
  nome: string
  dataInicio: string
  dataFim: string
  local: string
  ativo: boolean
}

export interface ApiErro {
  mensagem: string
  codigo?: string
  detalhes?: Record<string, string[]>
}

export type StatusRequisicao = 'idle' | 'carregando' | 'sucesso' | 'erro'
