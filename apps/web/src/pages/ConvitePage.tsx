import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { buscarConvitePublico, responderConvite } from '../services/voluntarioService'
import type { ConvitePublico } from '../services/voluntarioService'
import { Spinner } from '../components/ui/Spinner'
import type { ConviteVisual } from '../components/voluntarios/ConviteEditor'
import { CONVITE_VISUAL_PADRAO } from '../components/voluntarios/ConviteEditor'

// ── Extrai o visual do campo arteUrl (suporta JSON ou URL simples) ─────────────

function extrairVisual(arteUrl: string | null | undefined): ConviteVisual {
  if (!arteUrl) return CONVITE_VISUAL_PADRAO
  if (arteUrl.startsWith('{')) {
    try {
      return JSON.parse(arteUrl) as ConviteVisual
    } catch { /* fallback */ }
  }
  return { ...CONVITE_VISUAL_PADRAO, arteUrl }
}

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

  const visual = extrairVisual(convite.arteUrl)
  const jaRespondeu = convite.statusConvite !== 'pendente' && !alterando

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: visual.fundoCor, fontFamily: visual.fonte }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: visual.cardCor, border: `1px solid ${visual.bordaCor}` }}
      >
        {/* Faixa de destaque topo */}
        <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${visual.acentoCor}, transparent)` }} />

        {/* Arte do evento */}
        {visual.arteUrl && (
          <div className="w-full overflow-hidden" style={{ background: visual.fundoCor }}>
            <img
              src={visual.arteUrl}
              alt="Arte do convite"
              className="w-full h-auto object-contain"
              style={{ display: 'block', maxHeight: '480px', margin: '0 auto' }}
            />
          </div>
        )}

        {/* Cabeçalho — nome + equipe/função */}
        <div className="px-8 pt-7 pb-6 text-center" style={{ borderBottom: `1px solid ${visual.bordaCor}` }}>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: visual.acentoCor }}
          >
            {convite.tituloConvite || "Você está sendo convidado(a) a servir"}
          </p>

          <h1
            className="text-2xl font-bold leading-tight mb-3"
            style={{ color: visual.textoCor, fontFamily: visual.fonte }}
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
                    background: `${visual.acentoCor}22`,
                    border: `1px solid ${visual.acentoCor}66`,
                    color: visual.acentoCor,
                  }}
                >
                  {convite.equipeNome}
                </span>
              )}
              {convite.funcaoNome && (
                <span
                  className="text-sm"
                  style={{ color: visual.acentoCor, opacity: 0.85 }}
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
            style={{ color: visual.textoCor, opacity: 0.65, fontFamily: visual.fonte }}
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
              style={{ background: visual.fundoCor, border: `1px solid ${visual.bordaCor}` }}
            >
              {convite.observacaoConvite && (
                <p className="mb-1" style={{ color: visual.textoCor, opacity: 0.85 }}>
                  <span style={{ color: visual.acentoCor }}>Obs:</span> {convite.observacaoConvite}
                </p>
              )}
              {convite.dataResposta && (
                <p className="text-xs" style={{ color: visual.textoCor, opacity: 0.45 }}>
                  Respondido em {formatarData(convite.dataResposta)}
                </p>
              )}
            </div>
          )}

          {/* Formulário RSVP */}
          {!jaRespondeu && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: visual.textoCor, opacity: 0.6 }}>
                  Observação (opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Alguma observação ou recado..."
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1"
                  style={{
                    background: visual.fundoCor,
                    border: `1px solid ${visual.bordaCor}`,
                    color: visual.textoCor,
                    caretColor: visual.acentoCor,
                  }}
                />
              </div>

              <button
                onClick={() => enviarResposta('aceito')}
                disabled={enviando !== null}
                className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ background: visual.acentoCor, color: visual.fundoCor }}
              >
                {enviando === 'aceito' ? 'Registrando...' : '✓ Sim, Aceito Servir'}
              </button>

              <button
                onClick={() => enviarResposta('recusado')}
                disabled={enviando !== null}
                className="w-full rounded-lg py-3 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: visual.fundoCor, color: visual.textoCor, opacity: 0.7, border: `1px solid ${visual.bordaCor}` }}
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
                style={{ color: visual.textoCor, opacity: 0.55 }}
              >
                Deseja alterar sua resposta?
              </button>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div
          className="px-8 py-4 text-center text-xs"
          style={{ color: visual.textoCor, opacity: 0.4, borderTop: `1px solid ${visual.bordaCor}` }}
        >
          Retiro de Jovens · Fiat
          {convite.visualizadoEm && (
            <span className="block mt-0.5" style={{ opacity: 0.7 }}>
              Convite aberto em {formatarData(convite.visualizadoEm)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
