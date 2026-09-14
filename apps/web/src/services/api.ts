import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:3001')

// ── Access token em memória — NUNCA no localStorage ──────────────────────────
let _accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// ── Instância Axios ────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
})

// ── Interceptor de REQUEST — injeta Bearer token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Flag para evitar loop de refresh ──────────────────────────────────────────
let _isRefreshing = false
let _refreshQueue: Array<(token: string) => void> = []

function processQueue(newToken: string): void {
  _refreshQueue.forEach((cb) => cb(newToken))
  _refreshQueue = []
}

// ── Interceptor de RESPONSE — trata 401 com refresh ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('rt')
    if (!refreshToken) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    if (_isRefreshing) {
      return new Promise<string>((resolve) => {
        _refreshQueue.push(resolve)
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    _isRefreshing = true

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      )
      const newToken = data.accessToken
      setAccessToken(newToken)
      processQueue(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch {
      clearAuthAndRedirect()
      return Promise.reject(error)
    } finally {
      _isRefreshing = false
    }
  },
)

function clearAuthAndRedirect(): void {
  setAccessToken(null)
  localStorage.removeItem('rt')
  window.location.href = '/login'
}
