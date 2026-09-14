import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'

export function ProtectedRoute() {
  const { isAutenticado, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <Spinner className="w-8 h-8 text-[#1e3a5f]" />
      </div>
    )
  }

  if (!isAutenticado) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
