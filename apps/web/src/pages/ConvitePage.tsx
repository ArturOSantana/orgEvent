import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { buscarConvitePublico, responderConvite } from '../services/voluntarioService'
import type { ConvitePublico } from '../services/voluntarioService'
import { Spinner } from '../components/ui/Spinner'

// ── Utilitário ─────────────────────────────────────────────────────────────────

function formatarData(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Badge de status ────────────────────────────────────────────────────────────

function BadgeStatus({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    aceito: 'bg-green-100 text-green-800 border-green-300',
    recusado: 'bg-red-100 text-red-800 border-red-300',
    pendente: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  }
  const labels: Record<string, string> = {
    aceito: '✓ Presença confirmada',
    recusado: '✗ Resposta registrada',
    pendente: '⏳ Aguardando resposta',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${estilos[status] ?? estilos.pendente}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

// ── Componente principal ────────────────────────────────────────────────────────

export function ConvitePage() {
  const { slug } = useParams<{ slug: string }>()

  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando')
  const [convite, setConvite] = useState<ConvitePublico | null>(null)
  const [erroMsg, setErroMsg] = useState('')

  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState<'aceito' | 'recusado' | null>(null)
  const [alterando, setAlterando] = useState(false)

  useEffect(() => {
    if (!slug) {
      setErroMsg('Link inválido.')
      setEstado('erro')
      return
    }
    buscarConvitePublico(slug)
      .then((data) => {
        setConvite(data)
        setEstado('ok')
      })
      .catch(() => {
        setErroMsg('Convite não encontrado ou link inválido.')
        setEstado('erro')
      })
  }, [slug])

  async function enviarResposta(novoStatus: 'aceito' | 'recusado') {
    if (!slug) return
    setEnviando(novoStatus)
    try {
      const { convite: atualizado } = await responderConvite(slug, novoStatus, observacao)
      setConvite(atualizado)
      setAlterando(false)
      setObservacao('')
    } catch {
      alert('Ocorreu um erro ao registrar sua resposta. Tente novamente.')
    } finally {
      setEnviando(null)
    }
  }

  // ── Estados de carregamento / erro ─────────────────────────────────────────

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <Spinner className="w-10 h-10 text-yellow-400" />
      </div>
    )
  }

  if (estado === 'erro') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#121212' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🕊️</div>
          <h1 className="text-xl font-semibold text-white mb-2">Convite não encontrado</h1>
          <p className="text-gray-400 text-sm">{erroMsg}</p>
        </div>
      </div>
    )
  }

  if (!convite) return null

  const jaRespondeu = convite.statusConvite !== 'pendente' && !alterando

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #121212 0%, #1a1408 100%)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#1C1C1C', border: '1px solid #2a2510' }}
      >
        {/* Faixa dourada topo */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, transparent, #C9A96E, transparent)' }} />

        {/* Arte do evento */}
        <div className="w-full overflow-hidden bg-[#151515]">
          <img
            src={convite.arteUrl || "/arteRetiroJovens.jpeg"}
            alt="Arte do Retiro de Jovens Fiat"
            className="w-full h-auto object-contain"
            style={{ display: 'block', maxHeight: '480px', margin: '0 auto' }}
          />
        </div>

        {/* Cabeçalho — nome + equipe/função */}
        <div className="px-8 pt-7 pb-6 text-center" style={{ borderBottom: '1px solid #2a2510' }}>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: '#C9A96E' }}
          >
            {convite.tituloConvite || "Você está sendo convidado(a) a servir"}
          </p>

          <h1
            className="text-2xl font-bold leading-tight mb-3"
            style={{ color: '#F5F3EF', fontFamily: 'Georgia, serif' }}
          >
            {convite.nome}
          </h1>

          {/* Equipe e função em destaque */}
          {(convite.equipeNome || convite.funcaoNome) && (
            <div className="flex flex-col items-center gap-1.5 mt-1">
              {convite.equipeNome && (
                <span
                  className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                  style={{
                    background: 'rgba(201,169,110,0.15)',
                    border: '1px solid rgba(201,169,110,0.4)',
                    color: '#C9A96E',
                  }}
                >
                  {convite.equipeNome}
                </span>
              )}
              {convite.funcaoNome && (
                <span
                  className="text-sm"
                  style={{ color: '#E5B499' }}
                >
                  {convite.funcaoNome}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Corpo */}
        <div className="px-8 py-6">
          {/* Citação */}
          <p
            className="text-sm text-center mb-6 leading-relaxed italic whitespace-pre-line"
            style={{ color: '#9E9E9E', fontFamily: 'Georgia, serif' }}
          >
            {convite.mensagemConvite || '"Faça-se em mim segundo a Tua Palavra." — Lc 1,38'}
          </p>

          {/* Badge de status */}
          <div className="flex justify-center mb-5">
            <BadgeStatus status={convite.statusConvite} />
          </div>

          {/* Box de resposta registrada */}
          {convite.statusConvite !== 'pendente' && !alterando && (
            <div
              className="rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ background: '#151515', border: '1px solid #2a2510' }}
            >
              {convite.observacaoConvite && (
                <p className="text-gray-300 mb-1">
                  <span style={{ color: '#C9A96E' }}>Obs:</span> {convite.observacaoConvite}
                </p>
              )}
              {convite.dataResposta && (
                <p className="text-gray-500 text-xs">
                  Respondido em {formatarData(convite.dataResposta)}
                </p>
              )}
            </div>
          )}

          {/* Formulário RSVP */}
          {!jaRespondeu && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#9E9E9E' }}>
                  Observação (opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Alguma observação ou recado..."
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1"
                  style={{
                    background: '#151515',
                    border: '1px solid #2a2510',
                    color: '#F5F3EF',
                    caretColor: '#C9A96E',
                  }}
                />
              </div>

              <button
                onClick={() => enviarResposta('aceito')}
                disabled={enviando !== null}
                className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ background: '#C9A96E', color: '#121212' }}
              >
                {enviando === 'aceito' ? 'Registrando...' : '✓ Sim, Aceito Servir'}
              </button>

              <button
                onClick={() => enviarResposta('recusado')}
                disabled={enviando !== null}
                className="w-full rounded-lg py-3 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: '#1f1f1f', color: '#9E9E9E', border: '1px solid #2a2510' }}
              >
                {enviando === 'recusado' ? 'Registrando...' : 'Não poderei participar'}
              </button>
            </div>
          )}

          {/* Alterar resposta */}
          {jaRespondeu && (
            <div className="flex justify-center">
              <button
                onClick={() => setAlterando(true)}
                className="text-xs underline underline-offset-2"
                style={{ color: '#9E9E9E' }}
              >
                Deseja alterar sua resposta?
              </button>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div
          className="px-8 py-4 text-center text-xs"
          style={{ color: '#9E9E9E', borderTop: '1px solid #2a2510' }}
        >
          Retiro de Jovens · Fiat
          {convite.visualizadoEm && (
            <span className="block mt-0.5 text-gray-600">
              Convite aberto em {formatarData(convite.visualizadoEm)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
