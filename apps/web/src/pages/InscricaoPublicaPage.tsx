import { useState, useEffect } from 'react'
import type React from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { obterFormularioPublico, inscrever, type InscricaoComInstrucoes } from '../services/inscricaoService'
import type { FormularioInscricao } from '../services/inscricaoService'
import { Spinner } from '../components/ui/Spinner'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function InscricaoPublicaPage() {
  const { slug } = useParams<{ slug: string }>()

  const [formulario, setFormulario] = useState<Omit<FormularioInscricao, 'instrucoesPagamento'> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregar, setErroCarregar] = useState('')

  // Dados do formulário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [erros, setErros] = useState<Record<string, string>>({})

  // Estado após submit
  const [enviando, setEnviando] = useState(false)
  const [inscricao, setInscricao] = useState<InscricaoComInstrucoes | null>(null)
  const [erroPrincipal, setErroPrincipal] = useState('')

  useEffect(() => {
    if (!slug) return
    obterFormularioPublico(slug)
      .then(setFormulario)
      .catch(() => setErroCarregar('Formulário não encontrado ou link inválido.'))
      .finally(() => setCarregando(false))
  }, [slug])

  function validar(): boolean {
    const novosErros: Record<string, string> = {}
    if (!nome.trim()) novosErros['nome'] = 'Nome é obrigatório'
    if (formulario?.coletarEmail && !email.trim()) {
      novosErros['email'] = 'E-mail é obrigatório'
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      novosErros['email'] = 'E-mail inválido'
    }
    if (formulario?.coletarTelefone && !telefone.trim()) {
      novosErros['telefone'] = 'Telefone é obrigatório'
    }
    for (const campo of formulario?.campos ?? []) {
      if (campo.obrigatorio && !respostas[campo.id]?.trim()) {
        novosErros[campo.id] = `${campo.rotulo} é obrigatório`
      }
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug || !formulario) return
    if (!validar()) return

    setEnviando(true)
    setErroPrincipal('')
    try {
      const resultado = await inscrever(slug, {
        nome: nome.trim(),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        respostas: Object.entries(respostas)
          .filter(([, v]) => v.trim())
          .map(([campoId, valor]) => ({ campoId, valor: valor.trim() })),
      })
      setInscricao(resultado)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? ''
      if (msg) setErroPrincipal(msg)
      else setErroPrincipal('Não foi possível concluir a inscrição. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <Spinner className="w-8 h-8 text-[#1e3a5f]" />
      </div>
    )
  }

  if (erroCarregar || !formulario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">{erroCarregar || 'Formulário não encontrado.'}</p>
        </div>
      </div>
    )
  }

  if (!formulario.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-700 font-medium">As inscrições para este evento estão encerradas.</p>
        </div>
      </div>
    )
  }

  const valorNum = parseFloat(formulario.valorInscricao ?? '0')

  // ── Tela de confirmação ───────────────────────────────────────────────────
  if (inscricao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircleOutlined className="text-5xl text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inscrição realizada!</h2>
          <p className="text-gray-600 text-sm mb-4">
            Olá, <strong>{inscricao.nome}</strong>! Sua inscrição foi registrada com sucesso.
          </p>

          {inscricao.status === 'pendente_pagamento' && inscricao.instrucoesPagamento && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mt-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Próximo passo: Pagamento</p>
              <p className="text-sm text-yellow-700 whitespace-pre-line">
                {inscricao.instrucoesPagamento}
              </p>
            </div>
          )}

          {inscricao.status === 'confirmado' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-700">
                Sua inscrição está <strong>confirmada</strong>! Aguarde mais informações do organizador.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-6">Guarde este comprovante. ID: {inscricao.id.slice(0, 8)}</p>
        </div>
      </div>
    )
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-start justify-center p-4 py-10">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-lg w-full">
        {/* Cabeçalho */}
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-1">{formulario.titulo}</h1>
        {formulario.descricao && (
          <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{formulario.descricao}</p>
        )}

        {/* Info: vagas e prazo */}
        <div className="flex flex-wrap gap-3 mb-6">
          {formulario.vagas && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
              {formulario.vagas} vagas disponíveis
            </span>
          )}
          {formulario.dataLimite && (
            <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-1">
              Inscrições até{' '}
              {new Date(formulario.dataLimite).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          )}
          {valorNum > 0 && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
              Taxa: R$ {valorNum.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Campos padrão */}
          <Input
            label="Nome completo *"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={erros['nome']}
            autoComplete="name"
          />

          {formulario.coletarEmail && (
            <Input
              label="E-mail *"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={erros['email']}
              autoComplete="email"
            />
          )}

          {formulario.coletarTelefone && (
            <Input
              label="Telefone *"
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              error={erros['telefone']}
              autoComplete="tel"
            />
          )}

          {/* Campos extras */}
          {formulario.campos.map((campo) => (
            <div key={campo.id} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {campo.rotulo}
                {campo.obrigatorio && ' *'}
              </label>

              {campo.tipo === 'texto' && (
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  value={respostas[campo.id] ?? ''}
                  onChange={(e) =>
                    setRespostas((prev) => ({ ...prev, [campo.id]: e.target.value }))
                  }
                />
              )}

              {campo.tipo === 'textarea' && (
                <textarea
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  value={respostas[campo.id] ?? ''}
                  onChange={(e) =>
                    setRespostas((prev) => ({ ...prev, [campo.id]: e.target.value }))
                  }
                />
              )}

              {campo.tipo === 'select' && (
                <select
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  value={respostas[campo.id] ?? ''}
                  onChange={(e) =>
                    setRespostas((prev) => ({ ...prev, [campo.id]: e.target.value }))
                  }
                >
                  <option value="">Selecione...</option>
                  {(campo.opcoes ?? []).map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              )}

              {campo.tipo === 'checkbox' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={respostas[campo.id] === 'sim'}
                    onChange={(e) =>
                      setRespostas((prev) => ({
                        ...prev,
                        [campo.id]: e.target.checked ? 'sim' : '',
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  Sim
                </label>
              )}

              {erros[campo.id] && (
                <p className="text-xs text-red-600">{erros[campo.id]}</p>
              )}
            </div>
          ))}

          {erroPrincipal && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {erroPrincipal}
            </div>
          )}

          <Button type="submit" variant="primary" loading={enviando} className="mt-2">
            {enviando ? <><LoadingOutlined className="mr-2" />Enviando...</> : 'Enviar inscrição'}
          </Button>
        </form>
      </div>
    </div>
  )
}
