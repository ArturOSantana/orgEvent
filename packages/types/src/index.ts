/**
 * Tipos compartilhados entre apps/api e apps/web.
 * Importar via "@retirojovens/types".
 */

// Perfis de acesso por evento
export enum Perfil {
  CoordenadorGeral = 'coordenador',
  LiderDeEquipe = 'lider',
  VoluntarioComum = 'voluntario'
}

// Resposta padrao da API
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Resposta paginada da API
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  pagina: number
  porPagina: number
}
