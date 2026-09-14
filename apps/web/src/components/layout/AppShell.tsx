import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useAuth } from '../../hooks/useAuth'

export function AppShell() {
  const { logout, usuario } = useAuth()

  const usuarioNome = usuario?.nome ?? 'Usuário'
  const usuarioInicial = usuarioNome.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        onLogout={logout}
        usuarioNome={usuarioNome}
        usuarioInicial={usuarioInicial}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — somente desktop */}
        <Sidebar onLogout={logout} />

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Barra de navegação inferior — somente mobile */}
      <BottomNav />
    </div>
  )
}
