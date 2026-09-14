import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function NaoEncontradoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <p className="text-5xl font-bold text-gray-300 mb-4">404</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link to="/eventos">
          <Button variant="primary">Voltar para Eventos</Button>
        </Link>
      </Card>
    </div>
  )
}
