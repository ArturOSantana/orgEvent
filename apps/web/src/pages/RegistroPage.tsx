import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserAddOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'

const schema = z
  .object({
    nome: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirmação de senha obrigatória'),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

type FormValues = z.infer<typeof schema>

export function RegistroPage() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const carregando = useAuthStore((s) => s.carregando)
  const { registrar } = useAuth()
  const [erroRegistro, setErroRegistro] = useState<string | null>(null)

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
    setErroRegistro(null)
    try {
      await registrar(values.nome, values.email, values.senha)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      if (axiosError?.response?.data?.error) {
        setErroRegistro(axiosError.response.data.error)
      } else {
        setErroRegistro('Não foi possível criar a conta. Tente novamente.')
      }
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
          maxWidth: 420,
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
            Criar Conta
          </h1>
          <p className="text-sm mt-1" style={{ color: '#57606a' }}>
            Cadastre-se para acessar e gerenciar eventos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Campo Nome */}
          <div className="mb-4">
            <label
              htmlFor="nome"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1f2328' }}
            >
              Nome Completo
            </label>
            <input
              id="nome"
              type="text"
              autoComplete="name"
              {...register('nome')}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: errors.nome ? '1px solid #dc2626' : '1px solid #e5e7eb',
                color: '#1f2328',
                backgroundColor: '#fff',
              }}
              placeholder="Seu nome"
            />
            {errors.nome && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                {errors.nome.message}
              </p>
            )}
          </div>

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
          <div className="mb-4">
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
              autoComplete="new-password"
              {...register('senha')}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: errors.senha ? '1px solid #dc2626' : '1px solid #e5e7eb',
                color: '#1f2328',
                backgroundColor: '#fff',
              }}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.senha && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                {errors.senha.message}
              </p>
            )}
          </div>

          {/* Campo Confirmar Senha */}
          <div className="mb-6">
            <label
              htmlFor="confirmarSenha"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1f2328' }}
            >
              Confirmar Senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              {...register('confirmarSenha')}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: errors.confirmarSenha ? '1px solid #dc2626' : '1px solid #e5e7eb',
                color: '#1f2328',
                backgroundColor: '#fff',
              }}
              placeholder="Repita a senha"
            />
            {errors.confirmarSenha && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                {errors.confirmarSenha.message}
              </p>
            )}
          </div>

          {/* Erro de registro */}
          {erroRegistro && (
            <div
              className="mb-4 rounded-md px-3 py-2 text-sm"
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              {erroRegistro}
            </div>
          )}

          {/* Botão Cadastrar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {isSubmitting ? (
              <Spinner className="w-4 h-4 text-white" />
            ) : (
              <UserAddOutlined />
            )}
            Cadastrar
          </button>

          {/* Link para Login */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-[#1e3a5f] hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
