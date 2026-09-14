import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { alocarQuarto } from '../../services/participanteService'
import { listarQuartos, type Quarto } from '../../services/quartoService'

interface AlocarQuartoModalProps {
  eventoId: string
  participanteId: string
  participanteNome?: string
  quartoAtual?: string | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AlocarQuartoModal({
  eventoId,
  participanteId,
  participanteNome,
  quartoAtual,
  open,
  onClose,
  onSuccess,
}: AlocarQuartoModalProps) {
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [quartoSelecionado, setQuartoSelecionado] = useState(quartoAtual ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erroMsg, setErroMsg] = useState('')

  useEffect(() => {
    setQuartoSelecionado(quartoAtual ?? '')
  }, [quartoAtual])

  useEffect(() => {
    if (!open) return
    listarQuartos(eventoId)
      .then(setQuartos)
      .catch(() => setErroMsg('Erro ao carregar lista de quartos.'))
  }, [eventoId, open])

  async function handleSalvar() {
    setSalvando(true)
    setErroMsg('')
    try {
      await alocarQuarto(eventoId, participanteId, quartoSelecionado || null)
      onSuccess()
    } catch {
      setErroMsg('Ocorreu um erro ao alocar o participante no quarto. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const opcoes = [
    { value: '', label: '— Sem Quarto (Desalocar) —' },
    ...quartos.map((q) => {
      const lotacao = q.ocupacao !== undefined ? `(${q.ocupacao}/${q.capacidade})` : ''
      const gen = q.genero !== 'misto' ? `[${q.genero}]` : ''
      return {
        value: q.id,
        label: `${q.nome} ${gen} ${lotacao}`,
      }
    }),
  ]

  return (
    <Modal open={open} onClose={onClose} title={`Alocar no Quarto ${participanteNome ? `— ${participanteNome}` : ''}`}>
      <div className="space-y-4">
        {erroMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {erroMsg}
          </p>
        )}

        <Select
          label="Selecione o Quarto"
          options={opcoes}
          value={quartoSelecionado}
          onChange={(e) => setQuartoSelecionado(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button variant="primary" loading={salvando} onClick={handleSalvar}>
            Confirmar Alocação
          </Button>
        </div>
      </div>
    </Modal>
  )
}
