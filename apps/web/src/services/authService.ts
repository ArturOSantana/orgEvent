import { api, setAccessToken } from './api'

export interface UsuarioAuth {
  id: string
  nome: string
  email: string
  perfil: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  usuario: UsuarioAuth
}

interface RefreshResponse {
  accessToken: string
}

/**
 * Realiza login. Salva o refreshToken no localStorage e o accessToken em memória.
 * Nunca persiste o accessToken fora da memória.
 */
export async function login(email: string, senha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, senha })
  setAccessToken(data.accessToken)
  localStorage.setItem('rt', data.refreshToken)
  return data
}

/**
 * Realiza logout chamando o endpoint da API e limpando o estado local.
 */
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('rt')
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken })
    }
  } finally {
    setAccessToken(null)
    localStorage.removeItem('rt')
  }
}

/**
 * Tenta renovar o accessToken usando o refreshToken do localStorage.
 * Retorna o novo accessToken ou lança erro se o refresh falhar.
 */
export async function refresh(): Promise<string> {
  const refreshToken = localStorage.getItem('rt')
  if (!refreshToken) {
    throw new Error('Sem refresh token')
  }
  const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken })
  setAccessToken(data.accessToken)
  return data.accessToken
}
