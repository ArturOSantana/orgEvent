import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserOutlined, LogoutOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons'
import axios from 'axios'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import * as perfilService from '../services/perfilService'

// Schema para dados pessoais
const dadosPessoaisSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  email: z.string().email('E-mail inválido'),
})

type DadosPessoaisFormValues = z.infer<typeof dadosPessoaisSchema>

// Schema para troca de senha
const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: z
      .string()
      .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número'),
    confirmarNovaSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.novaSenha === data.confirmarNovaSenha, {
    message: 'A confirmação não coincide com a nova senha',
    path: ['confirmarNovaSenha'],
  })

type TrocarSenhaFormValues = z.infer<typeof trocarSenhaSchema>

export function PerfilPage() {
  const { usuario, logout } = useAuth()
  const setUsuario = useAuthStore((s) => s.setUsuario)

  // Estados de feedback - Seção 1
  const [mensagemPerfil, setMensagemPerfil] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; texto: string } | null>(null)
  
  // Estados de feedback - Seção 2
  const [mensagemSenha, setMensagemSenha] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; texto: string } | null>(null)

  // Data de criação (se carregada da API)
  const [criadoEm, setCriadoEm] = useState<string | null>(null)

  // Form 1: Dados pessoais
  const {
    register: registerPerfil,
    handleSubmit: handleSubmitPerfil,
    setValue: setValuePerfil,
    formState: { errors: errorsPerfil, isSubmitting: isSubmittingPerfil },
  } = useForm<DadosPessoaisFormValues>({
    resolver: zodResolver(dadosPessoaisSchema),
    defaultValues: {
      nome: usuario?.nome || '',
      email: usuario?.email || '',
    },
  })

  // Form 2: Trocar senha
  const {
    register: registerSenha,
    handleSubmit: handleSubmitSenha,
    reset: resetSenha,
    formState: { errors: errorsSenha, isSubmitting: isSubmittingSenha },
  } = useForm<TrocarSenhaFormValues>({
    resolver: zodResolver(trocarSenhaSchema),
  })

  useEffect(() => {
    if (usuario) {
      setValuePerfil('nome', usuario.nome)
      setValuePerfil('email', usuario.email)
    }

    // Tenta carregar informações adicionais do perfil (ex: criadoEm)
    let ativo = true
    perfilService
      .obterPerfil()
      .then((dados) => {
        if (ativo && dados) {
          if (dados.criadoEm) {
            setCriadoEm(dados.criadoEm)
          }
          if (dados.nome && !usuario?.nome) {
            setValuePerfil('nome', dados.nome)
          }
        }
      })
      .catch(() => {
        // Ignora falha de busca inicial caso não esteja disponível
      })

    return () => {
      ativo = false
    }
  }, [usuario, setValuePerfil])

  // Submissão dos Dados Pessoais
  async function onSubmitPerfil(values: DadosPessoaisFormValues) {
    setMensagemPerfil(null)
    try {
      const atualizado = await perfilService.atualizarPerfil(values.nome)
      setMensagemPerfil({ tipo: 'sucesso', texto: 'Dados atualizados com sucesso.' })
      if (usuario) {
        setUsuario({
          ...usuario,
          nome: atualizado.nome || values.nome,
        })
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setMensagemPerfil({ tipo: 'aviso', texto: 'Funcionalidade em breve' })
      } else {
        setMensagemPerfil({ tipo: 'erro', texto: 'Não foi possível salvar as alterações. Tente novamente.' })
      }
    }
  }

  // Submissão da Troca de Senha
  async function onSubmitSenha(values: TrocarSenhaFormValues) {
    setMensagemSenha(null)
    try {
      await perfilService.trocarSenha(values.senhaAtual, values.novaSenha)
      setMensagemSenha({ tipo: 'sucesso', texto: 'Senha alterada com sucesso.' })
      resetSenha()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setMensagemSenha({ tipo: 'aviso', texto: 'Funcionalidade em breve' })
          return
        }
        if (err.response?.status === 400 && err.response.data?.error) {
          setMensagemSenha({ tipo: 'erro', texto: err.response.data.error })
          return
        }
      }
      setMensagemSenha({ tipo: 'erro', texto: 'Não foi possível atualizar a senha. Verifique a senha atual.' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BotaoVoltar />
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <UserOutlined className="text-2xl text-primary-700" />
        <h1 className="text-2xl font-semibold text-gray-900">Meu Perfil</h1>
      </div>

      {/* Grid Principal: 2 colunas no desktop, 1 no mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção 1: Dados Pessoais */}
        <Card title="Dados Pessoais">
          {mensagemPerfil && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                mensagemPerfil.tipo === 'sucesso'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : mensagemPerfil.tipo === 'aviso'
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {mensagemPerfil.texto}
            </div>
          )}

          <form onSubmit={handleSubmitPerfil(onSubmitPerfil)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Nome"
              {...registerPerfil('nome')}
              error={errorsPerfil.nome?.message}
              placeholder="Seu nome completo"
            />

            <Input
              label="E-mail"
              {...registerPerfil('email')}
              readOnly
              disabled
              helperText="O e-mail não pode ser alterado."
            />

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmittingPerfil}
                icon={<SaveOutlined />}
              >
                Salvar alterações
              </Button>
            </div>
          </form>
        </Card>

        {/* Seção 2: Trocar Senha */}
        <Card title="Trocar Senha">
          {mensagemSenha && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                mensagemSenha.tipo === 'sucesso'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : mensagemSenha.tipo === 'aviso'
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {mensagemSenha.texto}
            </div>
          )}

          <form onSubmit={handleSubmitSenha(onSubmitSenha)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              {...registerSenha('senhaAtual')}
              error={errorsSenha.senhaAtual?.message}
              placeholder="••••••••"
            />

            <Input
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              {...registerSenha('novaSenha')}
              error={errorsSenha.novaSenha?.message}
              helperText="Mínimo de 8 caracteres com maiúscula, minúscula e número."
              placeholder="••••••••"
            />

            <Input
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              {...registerSenha('confirmarNovaSenha')}
              error={errorsSenha.confirmarNovaSenha?.message}
              placeholder="••••••••"
            />

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmittingSenha}
                icon={<LockOutlined />}
              >
                Atualizar senha
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Seção 3: Informações da Conta */}
      <div className="mt-6">
        <Card title="Informações da Conta">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <strong className="text-gray-900">E-mail:</strong> {usuario?.email || '-'}
              </p>
              {criadoEm && (
                <p>
                  <strong className="text-gray-900">Membro desde:</strong>{' '}
                  {new Date(criadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            <div>
              <Button
                type="button"
                variant="danger"
                onClick={() => logout()}
                icon={<LogoutOutlined />}
              >
                Sair da conta
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
