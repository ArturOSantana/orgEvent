import type React from 'react'
import { NavLink } from 'react-router-dom'
import {
  UnorderedListOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useEventoStore } from '../../store/eventoStore'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  onLogout?: () => void
  mobile?: boolean
}

const SUB_NAV_ITEMS = [
  { key: 'cronograma', label: 'Cronograma', icon: <ScheduleOutlined /> },
  { key: 'equipes', label: 'Equipes', icon: <TeamOutlined /> },
  { key: 'voluntarios', label: 'Voluntários', icon: <UserOutlined /> },
  { key: 'participantes', label: 'Participantes', icon: <UsergroupAddOutlined /> },
  { key: 'quartos', label: 'Quartos', icon: <HomeOutlined /> },
  { key: 'materiais', label: 'Materiais', icon: <ShoppingCartOutlined /> },
]

export function Sidebar({ onLogout, mobile }: SidebarProps) {
  const eventoAtivo = useEventoStore((s) => s.eventoAtivo)

  const rootClass = mobile
    ? 'flex flex-col w-full h-full bg-white'
    : 'hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-gray-200'

  const eventosItem: NavItem = { to: '/eventos', label: 'Eventos', icon: <UnorderedListOutlined /> }

  return (
    <aside className={rootClass}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <span className="text-primary-700 font-semibold text-base leading-tight">
          Gestor de Eventos
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Link fixo: Eventos */}
        <NavLink
          to={eventosItem.to}
          end
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            ].join(' ')
          }
        >
          <span className="text-base leading-none">{eventosItem.icon}</span>
          {eventosItem.label}
        </NavLink>

        {/* Sub-módulos: só quando há evento ativo */}
        {eventoAtivo ? (
          <>
            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
              {eventoAtivo.nome}
            </p>
            {SUB_NAV_ITEMS.map((item) => {
              const to = `/eventos/${eventoAtivo.id}/${item.key}`
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    ].join(' ')
                  }
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </NavLink>
              )
            })}
          </>
        ) : (
          <p className="px-3 pt-2 text-xs text-gray-400 italic">Selecione um evento</p>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="text-base leading-none">
            <LogoutOutlined />
          </span>
          Sair
        </button>
      </div>
    </aside>
  )
}
