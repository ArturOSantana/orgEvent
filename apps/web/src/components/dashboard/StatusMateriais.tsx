import { useState, useEffect } from 'react'
import { listarMateriais } from '../../services/materialService'
import type { MaterialStatus } from '../../services/materialService'
import { Spinner } from '../ui/Spinner'

interface StatusMateriaisProps {
  eventoId: string
}

interface Contagem {
  pendente: number
  adquirido: number
  entregue: number
}

const STATUS_CONFIG: {
  key: MaterialStatus
  label: string
  bar: string
  text: string
}[] = [
  { key: 'pendente', label: 'Pendente', bar: 'bg-yellow-400', text: 'text-yellow-700' },
  { key: 'adquirido', label: 'Adquirido', bar: 'bg-blue-400', text: 'text-blue-700' },
  { key: 'entregue', label: 'Entregue', bar: 'bg-green-400', text: 'text-green-700' },
]

export function StatusMateriais({ eventoId }: StatusMateriaisProps) {
  const [contagem, setContagem] = useState<Contagem>({ pendente: 0, adquirido: 0, entregue: 0 })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      try {
        // Busca todos sem paginação usando limit alto
        const resposta = await listarMateriais(eventoId, { limit: 1000 })

        if (cancelado) return

        const nova: Contagem = { pendente: 0, adquirido: 0, entregue: 0 }
        for (const m of resposta.data) {
          if (m.status in nova) nova[m.status as keyof Contagem]++
        }
        setContagem(nova)
      } catch {
        // silencia
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [eventoId])

  const total = contagem.pendente + contagem.adquirido + contagem.entregue

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Materiais por Status</h3>

      {carregando ? (
        <div className="flex justify-center py-4">
          <Spinner className="w-5 h-5 text-primary-600" />
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-gray-500">Nenhum material cadastrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {STATUS_CONFIG.map(({ key, label, bar, text }) => {
            const count = contagem[key]
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${text}`}>{label}</span>
                  <span className="text-xs text-gray-500">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
