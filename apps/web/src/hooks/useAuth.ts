import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import * as authService from '../services/authService'

export function useAuth() {
  const navigate = useNavigate()
  const { usuario, carregando, setUsuario, clearAuth } = useAuthStore()

  async function login(email: string, senha: string): Promise<void> {
    const data = await authService.login(email, senha)
    setUsuario(data.usuario)
    navigate('/eventos', { replace: true })
  }

  async function logout(): Promise<void> {
    await authService.logout()
    clearAuth()
    navigate('/login', { replace: true })
  }

  return {
    usuario,
    carregando,
    isAutenticado: usuario !== null,
    login,
    logout,
  }
}
