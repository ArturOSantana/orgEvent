import { useState } from 'react'
import { EditOutlined, TeamOutlined, CheckCircleOutlined, HomeOutlined, DeleteOutlined } from '@ant-design/icons'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { BadgeColor } from '../ui/Badge'
import type { Participante, ParticipanteStatus } from '../../services/participanteService'
import { fazerCheckin, removerParticipante } from '../../services/participanteService'

interface ParticipanteRowProps {
  participante: Participante
  eventoId: string
  onEditar: (participante: Participante) => void
  onAlocar: (participante: Participante) => void
  onAlocarQuarto?: (participante: Participante) => void
  onRemover?: (participante: Participante) => void
  onCheckin: (participante: Participante) => void
  podeEditar: boolean
}

const STATUS_LABEL: Record<ParticipanteStatus, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<ParticipanteStatus, BadgeColor> = {
  confirmado: 'green',
  pendente: 'yellow',
  cancelado: 'red',
}

export function ParticipanteRow({
  participante,
  eventoId,
  onEditar,
  onAlocar,
  onAlocarQuarto,
  onRemover,
  onCheckin,
  podeEditar,
}: ParticipanteRowProps) {
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  async function handleCheckin() {
    setCheckinLoading(true)
    try {
      const atualizado = await fazerCheckin(eventoId, participante.id)
      onCheckin(atualizado)
    } finally {
      setCheckinLoading(false)
    }
  }

  async function handleRemover() {
    if (!confirm(`Deseja realmente excluir o participante "${participante.nome}"?`)) {
      return
    }
    setRemovendo(true)
    try {
      await removerParticipante(eventoId, participante.id)
      onRemover?.(participante)
    } catch {
      alert('Erro ao excluir participante. Tente novamente.')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        <div>{participante.nome}</div>
        {participante.inscricaoId && (
          <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-normal">
            Inscrito Online
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{participante.email ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{participante.telefone ?? '—'}</td>
      <td className="px-4 py-3">
        <Badge
          label={STATUS_LABEL[participante.status]}
          color={STATUS_COLOR[participante.status]}
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {participante.equipe?.nome ?? <span className="text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {participante.quarto?.nome ?? <span className="text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {participante.checkinEm ? (
            <span
              className="inline-flex items-center justify-center w-7 h-7 text-green-600"
              title={`Check-in realizado em ${new Date(participante.checkinEm).toLocaleString('pt-BR')}`}
            >
              <CheckCircleOutlined style={{ fontSize: 18 }} />
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={<CheckCircleOutlined />}
              onClick={handleCheckin}
              loading={checkinLoading}
              title="Fazer check-in"
            />
          )}
          {podeEditar && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<EditOutlined />}
                onClick={() => onEditar(participante)}
                title="Editar participante"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<TeamOutlined />}
                onClick={() => onAlocar(participante)}
                title="Alocar em equipe"
              />
              {onAlocarQuarto && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<HomeOutlined />}
                  onClick={() => onAlocarQuarto(participante)}
                  title="Alocar em quarto"
                />
              )}
              {onRemover && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<DeleteOutlined />}
                  loading={removendo}
                  onClick={handleRemover}
                  title="Excluir participante"
                />
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
