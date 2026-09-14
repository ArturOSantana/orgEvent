import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LoginOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const carregando = useAuthStore((s) => s.carregando)
  const { login } = useAuth()
  const [erroLogin, setErroLogin] = useState<string | null>(null)

  // Redireciona se já autenticado
  useEffect(() => {
    if (!carregando && usuario) {
      navigate('/eventos', { replace: true })
    }
  }, [usuario, carregando, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setErroLogin(null)
    try {
      await login(values.email, values.senha)
    } catch {
      setErroLogin('Credenciais inválidas. Verifique seu e-mail e senha.')
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <Spinner className="w-8 h-8 text-[#1e3a5f]" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#f7f8fa' }}
    >
      <div
        className="w-full bg-white rounded-lg p-8"
        style={{
          maxWidth: 400,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07)',
        }}
      >
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: '#1e3a5f' }}
          >
            Gestor de Eventos
          </h1>
          <p className="text-sm mt-1" style={{ color: '#57606a' }}>
            Entre com sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Campo Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1f2328' }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: errors.email ? '1px solid #dc2626' : '1px solid #e5e7eb',
                color: '#1f2328',
                backgroundColor: '#fff',
              }}
              placeholder="voce@exemplo.com"
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Campo Senha */}
          <div className="mb-6">
            <label
              htmlFor="senha"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1f2328' }}
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              {...register('senha')}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: errors.senha ? '1px solid #dc2626' : '1px solid #e5e7eb',
                color: '#1f2328',
                backgroundColor: '#fff',
              }}
              placeholder="••••••••"
            />
            {errors.senha && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                {errors.senha.message}
              </p>
            )}
          </div>

          {/* Erro de login */}
          {erroLogin && (
            <div
              className="mb-4 rounded-md px-3 py-2 text-sm"
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              {erroLogin}
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {isSubmitting ? (
              <Spinner className="w-4 h-4 text-white" />
            ) : (
              <LoginOutlined />
            )}
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
