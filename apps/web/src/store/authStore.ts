import { create } from 'zustand'

export interface UsuarioAuth {
  id: string
  nome: string
  email: string
  perfil: string
}

interface AuthState {
  usuario: UsuarioAuth | null
  carregando: boolean
  setUsuario: (usuario: UsuarioAuth | null) => void
  setCarregando: (carregando: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  carregando: true,
  setUsuario: (usuario) => set({ usuario }),
  setCarregando: (carregando) => set({ carregando }),
  clearAuth: () => set({ usuario: null, carregando: false }),
}))
