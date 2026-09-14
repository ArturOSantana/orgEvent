import { NavLink } from 'react-router-dom'
import {
  UnorderedListOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { useEventoStore } from '../../store/eventoStore'

export function BottomNav() {
  const eventoAtivo = useEventoStore((s) => s.eventoAtivo)

  const items = eventoAtivo
    ? [
        { to: '/eventos', label: 'Eventos', icon: <UnorderedListOutlined /> },
        { to: `/eventos/${eventoAtivo.id}/cronograma`, label: 'Cronograma', icon: <ScheduleOutlined /> },
        { to: `/eventos/${eventoAtivo.id}/equipes`, label: 'Equipes', icon: <TeamOutlined /> },
        { to: `/eventos/${eventoAtivo.id}/participantes`, label: 'Participantes', icon: <UsergroupAddOutlined /> },
        { to: `/eventos/${eventoAtivo.id}/materiais`, label: 'Materiais', icon: <ShoppingCartOutlined /> },
      ]
    : [{ to: '/eventos', label: 'Eventos', icon: <UnorderedListOutlined /> }]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/eventos'}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')
            }
          >
            <span className="text-lg leading-none mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
