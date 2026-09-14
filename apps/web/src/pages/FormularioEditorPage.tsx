import { useState, useEffect, useCallback } from 'react'
import type React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlusOutlined, DeleteOutlined, HolderOutlined, LinkOutlined } from '@ant-design/icons'
import {
  obterFormulario,
  salvarFormulario,
  alternarAtivo,
  type FormularioInscricao,
  type TipoCampo,
} from '../services/inscricaoService'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'

interface CampoLocal {
  _key: string
  rotulo: string
  tipo: TipoCampo
  opcoes: string
  obrigatorio: boolean
  ordem: number
}

const TIPOS_CAMPO: { value: TipoCampo; label: string }[] = [
  { value: 'texto', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'select', label: 'Lista de opções' },
  { value: 'checkbox', label: 'Caixa de seleção' },
]

function novoCampo(ordem: number): CampoLocal {
  return {
    _key: `${Date.now()}-${Math.random()}`,
    rotulo: '',
    tipo: 'texto',
    opcoes: '',
    obrigatorio: false,
    ordem,
  }
}

export function FormularioEditorPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const navigate = useNavigate()

  const [formulario, setFormulario] = useState<FormularioInscricao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erroMsg, setErroMsg] = useState('')

  // Campos do formulário base
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [coletarEmail, setColetarEmail] = useState(true)
  const [coletarTelefone, setColetarTelefone] = useState(true)
  const [valor, setValor] = useState('0')
  const [instrucoes, setInstrucoes] = useState('')
  const [dataLimite, setDataLimite] = useState('')
  const [vagas, setVagas] = useState('')
  const [ativo, setAtivo] = useState(true)

  // Campos extras
  const [campos, setCampos] = useState<CampoLocal[]>([])

  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    try {
      const form = await obterFormulario(eventoId)
      if (form) {
        setFormulario(form)
        setTitulo(form.titulo)
        setDescricao(form.descricao ?? '')
        setColetarEmail(form.coletarEmail)
        setColetarTelefone(form.coletarTelefone)
        setValor(form.valorInscricao ?? '0')
        setInstrucoes(form.instrucoesPagamento ?? '')
        setDataLimite(form.dataLimite ? form.dataLimite.slice(0, 16) : '')
        setVagas(form.vagas?.toString() ?? '')
        setAtivo(form.ativo)
        setCampos(
          form.campos.map((c) => ({
            _key: c.id,
            rotulo: c.rotulo,
            tipo: c.tipo,
            opcoes: (c.opcoes ?? []).join('\n'),
            obrigatorio: c.obrigatorio,
            ordem: c.ordem,
          })),
        )
      }
    } catch {
      setErroMsg('Não foi possível carregar o formulário.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  function adicionarCampo() {
    setCampos((prev) => [...prev, novoCampo(prev.length)])
  }

  function removerCampo(key: string) {
    setCampos((prev) => prev.filter((c) => c._key !== key))
  }

  function atualizarCampo(key: string, patch: Partial<CampoLocal>) {
    setCampos((prev) =>
      prev.map((c) => (c._key === key ? { ...c, ...patch } : c)),
    )
  }

  function moverCampo(key: string, direcao: -1 | 1) {
    setCampos((prev) => {
      const idx = prev.findIndex((c) => c._key === key)
      if (idx < 0) return prev
      const novaLista = [...prev]
      const alvo = idx + direcao
      if (alvo < 0 || alvo >= novaLista.length) return prev
      ;[novaLista[idx], novaLista[alvo]] = [novaLista[alvo]!, novaLista[idx]!]
      return novaLista.map((c, i) => ({ ...c, ordem: i }))
    })
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!eventoId) return
    if (!titulo.trim()) {
      setErroMsg('Título é obrigatório.')
      return
    }
    setSalvando(true)
    setErroMsg('')
    setSucesso(false)
    try {
      await salvarFormulario(eventoId, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        coletarEmail,
        coletarTelefone,
        valorInscricao: valor || '0',
        instrucoesPagamento: instrucoes.trim() || undefined,
        ativo,
        dataLimite: dataLimite ? new Date(dataLimite).toISOString() : null,
        vagas: vagas ? parseInt(vagas, 10) : null,
        campos: campos.map((c, i) => ({
          rotulo: c.rotulo,
          tipo: c.tipo,
          opcoes:
            c.tipo === 'select'
              ? c.opcoes
                  .split('\n')
                  .map((o) => o.trim())
                  .filter(Boolean)
              : undefined,
          obrigatorio: c.obrigatorio,
          ordem: i,
        })),
      })
      setSucesso(true)
      carregar()
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { error?: string; detalhes?: unknown } } })?.response
      const status = response?.status
      const apiMsg = response?.data?.error ?? ''
      const detalhes = response?.data?.detalhes

      if (!response) {
        setErroMsg('Não foi possível conectar ao servidor. Verifique sua conexão.')
      } else if (status === 403) {
        setErroMsg('Sem permissão para salvar. Verifique se você é coordenador deste evento.')
      } else if (status === 400 && detalhes) {
        setErroMsg(`Dados inválidos: ${JSON.stringify(detalhes)}`)
      } else if (apiMsg) {
        setErroMsg(`Erro: ${apiMsg}`)
      } else {
        setErroMsg('Não foi possível salvar. Tente novamente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function handleAlternarAtivo() {
    if (!eventoId) return
    try {
      await alternarAtivo(eventoId, !ativo)
      setAtivo((v) => !v)
    } catch {
      alert('Não foi possível alterar o status.')
    }
  }

  const linkPublico = `${window.location.origin}/inscricao/${formulario?.slug ?? ''}`

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">
          {formulario ? 'Editar Formulário de Inscrição' : 'Criar Formulário de Inscrição'}
        </h1>
        {formulario && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                ativo
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
            <Button
              variant={ativo ? 'danger' : 'secondary'}
              size="sm"
              onClick={handleAlternarAtivo}
            >
              {ativo ? 'Desativar inscrições' : 'Ativar inscrições'}
            </Button>
          </div>
        )}
      </div>

      {/* Link público */}
      {formulario && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <LinkOutlined className="text-blue-500 shrink-0" />
          <span className="text-blue-700 font-medium mr-1">Link público:</span>
          <a
            href={linkPublico}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline truncate"
          >
            {linkPublico}
          </a>
          <button
            type="button"
            className="ml-auto text-blue-600 hover:text-blue-800 shrink-0 text-xs font-medium"
            onClick={() => navigator.clipboard.writeText(linkPublico)}
          >
            Copiar
          </button>
        </div>
      )}

      <form onSubmit={handleSalvar} className="flex flex-col gap-6">
        {/* Informações básicas */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Informações do Formulário
          </h2>

          <Input
            label="Título do formulário *"
            placeholder="Ex: Inscrição Retiro Jovens 2025"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
              placeholder="Texto de introdução exibido acima do formulário"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vagas disponíveis"
              type="number"
              min={1}
              placeholder="Ilimitado"
              value={vagas}
              onChange={(e) => setVagas(e.target.value)}
            />
            <Input
              label="Data limite para inscrição"
              type="datetime-local"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
            />
          </div>

          {/* Campos padrão */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Campos padrão coletados</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'E-mail', state: coletarEmail, setter: setColetarEmail },
                { label: 'Telefone', state: coletarTelefone, setter: setColetarTelefone },
              ].map(({ label, state, setter }) => (
                <label key={label} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setter(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Pagamento */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Pagamento
          </h2>
          <Input
            label="Valor da inscrição (R$)"
            type="number"
            min={0}
            step="0.01"
            placeholder="0 = gratuito"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Instruções de pagamento
            </label>
            <textarea
              rows={4}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
              placeholder="Ex: Pix: 11999999999 (fulano@email.com). Envie o comprovante para..."
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Exibido após o envio da inscrição quando o valor for maior que zero.
            </p>
          </div>
        </section>

        {/* Campos extras */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Campos extras
            </h2>
            <Button type="button" variant="secondary" size="sm" icon={<PlusOutlined />} onClick={adicionarCampo}>
              Adicionar campo
            </Button>
          </div>

          {campos.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhum campo extra. Nome{coletarEmail ? ', e-mail' : ''}{coletarTelefone ? ' e telefone' : ''} já são coletados automaticamente.
            </p>
          )}

          {campos.map((campo, idx) => (
            <div
              key={campo._key}
              className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <HolderOutlined className="text-gray-400 cursor-grab" />
                <span className="text-xs font-medium text-gray-500">Campo {idx + 1}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moverCampo(campo._key, -1)}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverCampo(campo._key, 1)}
                    disabled={idx === campos.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removerCampo(campo._key)}
                    className="text-red-400 hover:text-red-600 ml-2"
                    title="Remover"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Rótulo do campo *"
                  placeholder="Ex: Igreja, Cidade, Dieta"
                  value={campo.rotulo}
                  onChange={(e) => atualizarCampo(campo._key, { rotulo: e.target.value })}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    value={campo.tipo}
                    onChange={(e) =>
                      atualizarCampo(campo._key, { tipo: e.target.value as TipoCampo })
                    }
                  >
                    {TIPOS_CAMPO.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {campo.tipo === 'select' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Opções (uma por linha)
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
                    placeholder={"Opção A\nOpção B\nOpção C"}
                    value={campo.opcoes}
                    onChange={(e) => atualizarCampo(campo._key, { opcoes: e.target.value })}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={campo.obrigatorio}
                  onChange={(e) =>
                    atualizarCampo(campo._key, { obrigatorio: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                Campo obrigatório
              </label>
            </div>
          ))}
        </section>

        {/* Feedback */}
        {erroMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            {erroMsg}
          </p>
        )}
        {sucesso && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">
            Formulário salvo com sucesso!
            {formulario && (
              <> Link: <a href={linkPublico} target="_blank" rel="noopener noreferrer" className="underline">{linkPublico}</a></>
            )}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/eventos/${eventoId}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={salvando}>
            Salvar formulário
          </Button>
        </div>
      </form>
    </div>
  )
}
