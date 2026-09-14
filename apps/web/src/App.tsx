import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthStore } from './store/authStore'
import * as authService from './services/authService'
import { syncService } from './services/syncService'

function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

function AppInit() {
  const { setUsuario, setCarregando } = useAuthStore()

  useEffect(() => {
    async function initAuth() {
      const refreshToken = localStorage.getItem('rt')
      if (!refreshToken) {
        setCarregando(false)
        return
      }
      try {
        const accessToken = await authService.refresh()
        const payload = parseJwt(accessToken)
        if (
          payload.sub &&
          typeof payload.sub === 'string' &&
          typeof payload.nome === 'string' &&
          typeof payload.email === 'string'
        ) {
          setUsuario({
            id: payload.sub,
            nome: payload.nome,
            email: payload.email,
            perfil: typeof payload.perfil === 'string' ? payload.perfil : 'voluntario',
          })
        }
      } catch {
        localStorage.removeItem('rt')
      } finally {
        setCarregando(false)
      }
    }

    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <RouterProvider router={router} />
}

function SyncProvider() {
  useEffect(() => {
    // Quando ficar online, disparar sync automaticamente
    const handleOnline = async () => {
      await syncService.sincronizar()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  useEffect(() => {
    // Sync periodico a cada 5 minutos quando online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncService.sincronizar()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return null
}

export function App() {
  return (
    <>
      <SyncProvider />
      <AppInit />
    </>
  )
}
