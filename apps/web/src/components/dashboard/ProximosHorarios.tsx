import { useState, useEffect } from 'react'
import { ClockCircleOutlined } from '@ant-design/icons'
import { listarHorarios, listarFases } from '../../services/cronogramaService'
import type { Horario, Fase } from '../../services/cronogramaService'
import { Spinner } from '../ui/Spinner'

interface ProximosHorariosProps {
  eventoId: string
}

function formatarDataCurta(isoDate: string): string {
  // data vem como "YYYY-MM-DD"
  const [, mm, dd] = isoDate.split('-')
  return `${dd}/${mm}`
}

export function ProximosHorarios({ eventoId }: ProximosHorariosProps) {
  const [proximos, setProximos] = useState<Horario[]>([])
  const [fases, setFases] = useState<Record<string, Fase>>({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      try {
        const [horarios, fasesLista] = await Promise.all([
          listarHorarios(eventoId),
          listarFases(eventoId),
        ])

        if (cancelado) return

        const fasesMap: Record<string, Fase> = {}
        for (const f of fasesLista) {
          fasesMap[f.id] = f
        }
        setFases(fasesMap)

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const futuros = horarios
          .filter((h) => {
            const dataHorario = new Date(h.data + 'T00:00:00')
            return dataHorario >= hoje
          })
          .sort((a, b) => {
            const diff = a.data.localeCompare(b.data)
            if (diff !== 0) return diff
            return a.horaInicio.localeCompare(b.horaInicio)
          })
          .slice(0, 3)

        setProximos(futuros)
      } catch {
        // silencia erros — o dashboard não deve quebrar se o cronograma falhar
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [eventoId])

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ClockCircleOutlined className="text-primary-600" />
        <h3 className="text-sm font-semibold text-gray-800">Próximos Horários</h3>
      </div>

      {carregando ? (
        <div className="flex justify-center py-4">
          <Spinner className="w-5 h-5 text-primary-600" />
        </div>
      ) : proximos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum horário programado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {proximos.map((h) => (
            <li
              key={h.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="text-center shrink-0 w-10">
                <p className="text-xs font-bold text-primary-700 leading-none">
                  {formatarDataCurta(h.data)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {h.horaInicio}–{h.horaFim}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{h.titulo}</p>
                {h.faseId && fases[h.faseId] && (
                  <p className="text-xs text-gray-500 mt-0.5">{fases[h.faseId].nome}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
