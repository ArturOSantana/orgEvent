import { useState } from 'react'

// ── Artes pré-definidas ────────────────────────────────────────────────────────

export interface ArteOpcao {
  id: string
  label: string
  src: string
}

const ARTES_PADRAO: ArteOpcao[] = [
  { id: 'retiro-jovens', label: 'Retiro Jovens', src: '/arteRetiroJovens.jpeg' },
]

// ── Fontes disponíveis ─────────────────────────────────────────────────────────

const FONTES = [
  { value: 'Georgia, serif',            label: 'Georgia (Serif)' },
  { value: '"Times New Roman", serif',  label: 'Times New Roman' },
  { value: 'system-ui, sans-serif',     label: 'Sistema (Sans-serif)' },
  { value: '"Arial", sans-serif',       label: 'Arial' },
  { value: '"Verdana", sans-serif',     label: 'Verdana' },
  { value: '"Trebuchet MS", sans-serif',label: 'Trebuchet' },
  { value: '"Courier New", monospace',  label: 'Courier New (Mono)' },
]

// ── Paletas pré-definidas ──────────────────────────────────────────────────────

interface Paleta {
  label: string
  fundo: string
  acento: string
  texto: string
  bordaFundo: string
  fundoCard: string
}

const PALETAS: Paleta[] = [
  {
    label: 'Ouro Noturno',
    fundo: '#121212',
    acento: '#C9A96E',
    texto: '#F5F3EF',
    bordaFundo: '#2a2510',
    fundoCard: '#1C1C1C',
  },
  {
    label: 'Azul Marinho',
    fundo: '#0a1628',
    acento: '#4A90E2',
    texto: '#EAF0FB',
    bordaFundo: '#1a2d4a',
    fundoCard: '#0f1f3a',
  },
  {
    label: 'Verde Floresta',
    fundo: '#0e1a0e',
    acento: '#4CAF50',
    texto: '#F0F8F0',
    bordaFundo: '#1e3a1e',
    fundoCard: '#152015',
  },
  {
    label: 'Roxo Místico',
    fundo: '#1a0a2e',
    acento: '#9C27B0',
    texto: '#F5EFF8',
    bordaFundo: '#2d1445',
    fundoCard: '#230d3c',
  },
  {
    label: 'Branco Claro',
    fundo: '#f8f8f6',
    acento: '#b5862b',
    texto: '#1a1a1a',
    bordaFundo: '#e0d9c8',
    fundoCard: '#ffffff',
  },
  {
    label: 'Vermelho Vinho',
    fundo: '#1a0505',
    acento: '#C0392B',
    texto: '#F8F0F0',
    bordaFundo: '#3a1010',
    fundoCard: '#200808',
  },
]

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface ConviteVisual {
  arteUrl: string
  fundoCor: string
  acentoCor: string
  textoCor: string
  bordaCor: string
  cardCor: string
  fonte: string
}

interface ConviteEditorProps {
  value: ConviteVisual
  onChange: (v: ConviteVisual) => void
  nomeExemplo?: string
  equipeExemplo?: string
  funcaoExemplo?: string
  tituloExemplo?: string
  mensagemExemplo?: string
  artesExtras?: ArteOpcao[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          style={{ padding: '1px' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={9}
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

// ── Pré-visualização ───────────────────────────────────────────────────────────

function Preview({
  v,
  nomeExemplo,
  equipeExemplo,
  funcaoExemplo,
  tituloExemplo,
  mensagemExemplo,
}: {
  v: ConviteVisual
  nomeExemplo: string
  equipeExemplo: string
  funcaoExemplo: string
  tituloExemplo: string
  mensagemExemplo: string
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-xl mx-auto"
      style={{
        background: v.fundoCor,
        border: `1px solid ${v.bordaCor}`,
        maxWidth: 340,
        fontFamily: v.fonte,
      }}
    >
      {/* Faixa topo */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${v.acentoCor}, transparent)` }} />

      {/* Arte */}
      {v.arteUrl ? (
        <div style={{ background: v.fundoCor }}>
          <img
            src={v.arteUrl}
            alt="Arte do convite"
            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }}
          />
        </div>
      ) : (
        <div
          style={{
            height: 100,
            background: v.cardCor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: v.acentoCor,
            borderBottom: `1px solid ${v.bordaCor}`,
          }}
        >
          Nenhuma arte selecionada
        </div>
      )}

      {/* Cabeçalho */}
      <div
        style={{
          padding: '18px 24px 14px',
          textAlign: 'center',
          borderBottom: `1px solid ${v.bordaCor}`,
        }}
      >
        <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: v.acentoCor, marginBottom: 8 }}>
          {tituloExemplo || 'Você está sendo convidado(a) a servir'}
        </p>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: v.textoCor, margin: '0 0 8px' }}>
          {nomeExemplo || 'Nome do Voluntário'}
        </h1>
        {(equipeExemplo || funcaoExemplo) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {equipeExemplo && (
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '3px 12px', borderRadius: 999,
                background: `${v.acentoCor}22`,
                border: `1px solid ${v.acentoCor}66`,
                color: v.acentoCor,
              }}>
                {equipeExemplo}
              </span>
            )}
            {funcaoExemplo && (
              <span style={{ fontSize: 12, color: v.acentoCor, opacity: 0.8 }}>{funcaoExemplo}</span>
            )}
          </div>
        )}
      </div>

      {/* Corpo */}
      <div style={{ padding: '14px 24px' }}>
        <p style={{ fontSize: 11, textAlign: 'center', fontStyle: 'italic', color: v.textoCor, opacity: 0.6, marginBottom: 14 }}>
          {mensagemExemplo || '"Faça-se em mim segundo a Tua Palavra." — Lc 1,38'}
        </p>

        {/* Badge status */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 999,
            background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04',
          }}>
            ⏳ Aguardando resposta
          </span>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            padding: '10px', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 600,
            background: v.acentoCor, color: v.fundoCor,
          }}>
            ✓ Sim, Aceito Servir
          </div>
          <div style={{
            padding: '10px', borderRadius: 8, textAlign: 'center', fontSize: 12,
            background: v.cardCor, color: v.textoCor, opacity: 0.7,
            border: `1px solid ${v.bordaCor}`,
          }}>
            Não poderei participar
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{
        padding: '10px 24px', textAlign: 'center', fontSize: 10,
        color: v.textoCor, opacity: 0.4,
        borderTop: `1px solid ${v.bordaCor}`,
      }}>
        Retiro de Jovens · Fiat
      </div>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────────

export function ConviteEditor({
  value,
  onChange,
  nomeExemplo = '',
  equipeExemplo = '',
  funcaoExemplo = '',
  tituloExemplo = '',
  mensagemExemplo = '',
  artesExtras = [],
}: ConviteEditorProps) {
  const [abaAtiva, setAbaAtiva] = useState<'arte' | 'cores' | 'fonte'>('arte')
  const [arteCustomUrl, setArteCustomUrl] = useState(
    ARTES_PADRAO.some((a) => a.src === value.arteUrl) ? '' : value.arteUrl
  )

  const todasArtes: ArteOpcao[] = [...ARTES_PADRAO, ...artesExtras]

  function aplicarPaleta(p: Paleta) {
    onChange({ ...value, fundo: p.fundo, acento: p.acento, texto: p.texto, borda: p.bordaFundo, card: p.fundoCard } as unknown as ConviteVisual)
    onChange({
      ...value,
      fundoCor: p.fundo,
      acentoCor: p.acento,
      textoCor: p.texto,
      bordaCor: p.bordaFundo,
      cardCor: p.fundoCard,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Abas */}
      <div className="flex border-b border-gray-200">
        {(['arte', 'cores', 'fonte'] as const).map((aba) => (
          <button
            key={aba}
            type="button"
            onClick={() => setAbaAtiva(aba)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${
              abaAtiva === aba
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {aba === 'arte' ? '🖼 Arte' : aba === 'cores' ? '🎨 Cores' : '🔤 Fonte'}
          </button>
        ))}
        <span className="flex-1" />
        <span className="px-3 py-2 text-xs text-gray-400 italic">Pré-visualização ao vivo →</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Painel esquerdo — controles */}
        <div className="flex-1 min-w-0">

          {/* ABA ARTE */}
          {abaAtiva === 'arte' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-500">Selecione uma arte pré-definida ou cole um link externo.</p>

              {/* Grid de artes */}
              <div className="grid grid-cols-2 gap-3">
                {todasArtes.map((arte) => (
                  <button
                    key={arte.id}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, arteUrl: arte.src })
                      setArteCustomUrl('')
                    }}
                    className={`rounded-lg overflow-hidden border-2 transition-all text-left ${
                      value.arteUrl === arte.src
                        ? 'border-primary-500 shadow-md'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <img
                      src={arte.src}
                      alt={arte.label}
                      className="w-full object-cover"
                      style={{ height: 90 }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="px-2 py-1.5 flex items-center justify-between bg-white">
                      <span className="text-xs font-medium text-gray-700 truncate">{arte.label}</span>
                      {value.arteUrl === arte.src && (
                        <span className="text-xs text-primary-600 font-bold ml-1">✓</span>
                      )}
                    </div>
                  </button>
                ))}

                {/* Opção: sem arte */}
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...value, arteUrl: '' })
                    setArteCustomUrl('')
                  }}
                  className={`rounded-lg border-2 transition-all flex items-center justify-center ${
                    value.arteUrl === ''
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dashed border-gray-200 hover:border-gray-400 bg-gray-50'
                  }`}
                  style={{ height: 116 }}
                >
                  <span className="text-xs text-gray-400">Sem arte</span>
                </button>
              </div>

              {/* URL customizada */}
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-xs font-medium text-gray-600">Ou cole um link de imagem (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={arteCustomUrl}
                    onChange={(e) => setArteCustomUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="flex-1 text-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    type="button"
                    disabled={!arteCustomUrl.trim()}
                    onClick={() => onChange({ ...value, arteUrl: arteCustomUrl.trim() })}
                    className="px-3 py-2 text-xs bg-primary-600 text-white rounded disabled:opacity-40 hover:bg-primary-700 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
                {value.arteUrl && !ARTES_PADRAO.some((a) => a.src === value.arteUrl) && value.arteUrl !== '' && (
                  <p className="text-xs text-primary-600">✓ URL customizada aplicada</p>
                )}
              </div>
            </div>
          )}

          {/* ABA CORES */}
          {abaAtiva === 'cores' && (
            <div className="flex flex-col gap-5">
              {/* Paletas rápidas */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Paletas rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  {PALETAS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => aplicarPaleta(p)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-400 transition-colors text-left"
                    >
                      {/* Amostra de cores */}
                      <span className="flex gap-1 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ background: p.fundo }} />
                        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ background: p.acento }} />
                        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ background: p.texto }} />
                      </span>
                      <span className="text-xs text-gray-700 truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cores individuais */}
              <div className="grid grid-cols-1 gap-3">
                <ColorPicker label="Cor de fundo" value={value.fundoCor} onChange={(v) => onChange({ ...value, fundoCor: v })} />
                <ColorPicker label="Cor do card" value={value.cardCor} onChange={(v) => onChange({ ...value, cardCor: v })} />
                <ColorPicker label="Cor de borda" value={value.bordaCor} onChange={(v) => onChange({ ...value, bordaCor: v })} />
                <ColorPicker label="Cor de destaque (acento)" value={value.acentoCor} onChange={(v) => onChange({ ...value, acentoCor: v })} />
                <ColorPicker label="Cor do texto principal" value={value.textoCor} onChange={(v) => onChange({ ...value, textoCor: v })} />
              </div>
            </div>
          )}

          {/* ABA FONTE */}
          {abaAtiva === 'fonte' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500">Escolha a fonte usada nos textos do convite.</p>
              <div className="flex flex-col gap-2">
                {FONTES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => onChange({ ...value, fonte: f.value })}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      value.fonte === f.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <span style={{ fontFamily: f.value, fontSize: 15 }}>
                      Retiro de Jovens
                    </span>
                    <span className="text-xs text-gray-500 ml-3 shrink-0">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pré-visualização */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pré-visualização</p>
          <div className="overflow-auto" style={{ maxHeight: 600 }}>
            <Preview
              v={value}
              nomeExemplo={nomeExemplo}
              equipeExemplo={equipeExemplo}
              funcaoExemplo={funcaoExemplo}
              tituloExemplo={tituloExemplo}
              mensagemExemplo={mensagemExemplo}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Valores padrão exportados ──────────────────────────────────────────────────

export const CONVITE_VISUAL_PADRAO: ConviteVisual = {
  arteUrl: '/arteRetiroJovens.jpeg',
  fundoCor: '#121212',
  acentoCor: '#C9A96E',
  textoCor: '#F5F3EF',
  bordaCor: '#2a2510',
  cardCor: '#1C1C1C',
  fonte: 'Georgia, serif',
}
