import { api } from './api'

export interface PerfilUsuario {
  id: string
  nome: string
  email: string
  criadoEm?: string
  atualizadoEm?: string
}

export async function obterPerfil(): Promise<PerfilUsuario> {
  const { data } = await api.get<PerfilUsuario>('/api/perfil')
  return data
}

export async function atualizarPerfil(nome: string): Promise<PerfilUsuario> {
  const { data } = await api.put<PerfilUsuario>('/api/perfil', { nome })
  return data
}

export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<{ ok: boolean; mensagem?: string }> {
  const { data } = await api.put<{ ok: boolean; mensagem?: string }>('/api/perfil/senha', {
    senhaAtual,
    novaSenha,
  })
  return data
}
