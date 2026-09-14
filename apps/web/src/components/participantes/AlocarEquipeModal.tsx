import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { listarEquipes } from '../../services/equipeService'
import { alocarEquipe } from '../../services/participanteService'
import type { Equipe } from '../../services/equipeService'

interface AlocarEquipeModalProps {
  eventoId: string
  participanteId: string
  equipeAtual?: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AlocarEquipeModal({
  eventoId,
  participanteId,
  equipeAtual,
  open,
  onClose,
  onSuccess,
}: AlocarEquipeModalProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [equipeId, setEquipeId] = useState(equipeAtual ?? '')
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroMsg, setErroMsg] = useState('')

  useEffect(() => {
    if (!open) return
    setEquipeId(equipeAtual ?? '')
    setErroMsg('')
    setCarregando(true)
    listarEquipes(eventoId)
      .then(setEquipes)
      .catch(() => setErroMsg('Nao foi possivel carregar as equipes.'))
      .finally(() => setCarregando(false))
  }, [open, eventoId, equipeAtual])

  async function handleConfirmar() {
    setSalvando(true)
    setErroMsg('')
    try {
      await alocarEquipe(eventoId, participanteId, equipeId)
      onSuccess()
    } catch {
      setErroMsg('Ocorreu um erro ao alocar o participante. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const opcoes = [
    { value: '', label: 'Sem equipe' },
    ...equipes.map((e) => ({ value: e.id, label: e.nome })),
  ]

  return (
    <Modal open={open} onClose={onClose} title="Alocar em Equipe">
      <div className="flex flex-col gap-4">
        {erroMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {erroMsg}
          </p>
        )}

        <Select
          label="Equipe"
          options={opcoes}
          value={equipeId}
          onChange={(e) => setEquipeId(e.target.value)}
          disabled={carregando}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={salvando}
            disabled={carregando}
            onClick={handleConfirmar}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
