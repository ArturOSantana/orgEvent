import { useState, useEffect } from 'react'
import { UserAddOutlined } from '@ant-design/icons'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Spinner } from '../ui/Spinner'
import { VoluntarioForm } from '../voluntarios/VoluntarioForm'
import { listarVoluntarios } from '../../services/voluntarioService'
import { adicionarMembro } from '../../services/equipeService'
import type { Funcao } from '../../services/equipeService'
import type { Voluntario } from '../../services/voluntarioService'

interface AdicionarMembroModalProps {
  eventoId: string
  equipeId: string
  funcoes: Funcao[]
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AdicionarMembroModal({
  eventoId,
  equipeId,
  funcoes,
  open,
  onClose,
  onSuccess,
}: AdicionarMembroModalProps) {
  const [busca, setBusca] = useState('')
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([])
  const [carregando, setCarregando] = useState(false)
  const [voluntarioSelecionadoId, setVoluntarioSelecionadoId] = useState('')
  const [funcaoId, setFuncaoId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroMsg, setErroMsg] = useState('')
  const [criarVoluntarioAberto, setCriarVoluntarioAberto] = useState(false)

  useEffect(() => {
    if (!open) return
    setCarregando(true)
    listarVoluntarios(eventoId, { busca: busca || undefined })
      .then(setVoluntarios)
      .catch(() => setErroMsg('Não foi possível carregar os voluntários.'))
      .finally(() => setCarregando(false))
  }, [eventoId, busca, open])

  async function handleAdicionar() {
    if (!voluntarioSelecionadoId) {
      setErroMsg('Selecione um voluntário.')
      return
    }
    setSalvando(true)
    setErroMsg('')
    try {
      await adicionarMembro(eventoId, equipeId, voluntarioSelecionadoId, funcaoId || undefined)
      setVoluntarioSelecionadoId('')
      setFuncaoId('')
      onSuccess()
    } catch {
      setErroMsg('Não foi possível adicionar o membro. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function handleVoluntarioCriado(novoVoluntario: Voluntario) {
    setVoluntarios((prev) => [...prev, novoVoluntario])
    setVoluntarioSelecionadoId(novoVoluntario.id)
    setCriarVoluntarioAberto(false)
  }

  function handleClose() {
    setBusca('')
    setVoluntarioSelecionadoId('')
    setFuncaoId('')
    setErroMsg('')
    onClose()
  }

  const funcaoOptions = [
    { value: '', label: 'Sem funcao' },
    ...funcoes.map((f) => ({ value: f.id, label: f.nome })),
  ]

  const voluntarioOptions = voluntarios.map((v) => ({ value: v.id, label: v.nome }))

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Adicionar Membro">
        <div className="flex flex-col gap-4">
          {erroMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {erroMsg}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Buscar voluntário</label>
            <Input
              placeholder="Digite para filtrar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <div className="flex justify-center py-4">
              <Spinner className="w-5 h-5 text-primary-600" />
            </div>
          ) : (
            <Select
              label="Voluntário *"
              placeholder="Selecione um voluntário"
              options={voluntarioOptions}
              value={voluntarioSelecionadoId}
              onChange={(e) => setVoluntarioSelecionadoId(e.target.value)}
            />
          )}

          <Select
            label="Função (opcional)"
            options={funcaoOptions}
            value={funcaoId}
            onChange={(e) => setFuncaoId(e.target.value)}
          />

          <div className="flex flex-col gap-2 pt-1">
            <div className="flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setCriarVoluntarioAberto(true)}
                className="text-xs text-primary-600 hover:text-primary-800 underline underline-offset-2"
              >
                <UserAddOutlined className="mr-1" />
                Criar novo voluntário
              </button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClose} disabled={salvando}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAdicionar}
                  loading={salvando}
                  disabled={!voluntarioSelecionadoId}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {criarVoluntarioAberto && (
        <VoluntarioForm
          eventoId={eventoId}
          onSuccess={handleVoluntarioCriado}
          onCancel={() => setCriarVoluntarioAberto(false)}
        />
      )}
    </>
  )
}
