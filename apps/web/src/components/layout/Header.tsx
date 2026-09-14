import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import { Sidebar } from './Sidebar'
import { SyncStatus } from '../sync/SyncStatus'

interface HeaderProps {
  eventoNome?: string
  usuarioNome?: string
  usuarioInicial?: string
  onLogout?: () => void
}

export function Header({
  eventoNome,
  usuarioNome = 'Usuário',
  usuarioInicial,
  onLogout,
}: HeaderProps) {
  const [drawerAberto, setDrawerAberto] = useState(false)
  const navigate = useNavigate()
  const inicial = usuarioInicial ?? usuarioNome.charAt(0).toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3">
        {/* Botão menu mobile */}
        <button
          className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => setDrawerAberto(true)}
          aria-label="Abrir menu"
        >
          <MenuOutlined />
        </button>

        {/* Título / evento ativo */}
        <div className="flex-1 min-w-0">
          <Link to="/eventos" className="hover:opacity-80 transition-opacity">
            <span className="block truncate text-sm font-semibold text-gray-800">
              {eventoNome ?? 'Gestor de Eventos'}
            </span>
          </Link>
        </div>

        {/* Status de sincronizacao */}
        <SyncStatus />

        {/* Avatar com dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="w-8 h-8 rounded-full bg-primary-700 text-white text-sm font-medium flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-400"
              aria-label="Menu do usuário"
            >
              {inicial}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="min-w-[160px] bg-white rounded-md border border-gray-200 shadow-md py-1 z-50"
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">Conectado como</p>
                <p className="text-sm font-medium text-gray-800 truncate">{usuarioNome}</p>
              </div>

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                onSelect={() => navigate('/perfil')}
              >
                <UserOutlined />
                Meu perfil
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 outline-none"
                onSelect={onLogout}
              >
                <LogoutOutlined />
                Sair
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </header>

      {/* Drawer mobile */}
      {drawerAberto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setDrawerAberto(false)}
          />
          {/* Painel lateral */}
          <div className="relative flex flex-col bg-white w-64 h-full shadow-xl">
            <Sidebar onLogout={onLogout} mobile={true} />
          </div>
        </div>
      )}
    </>
  )
}
