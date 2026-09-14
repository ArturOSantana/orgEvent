import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { adicionarUsuario } from '../../services/eventoService'

interface AdicionarUsuarioModalProps {
  eventoId: string
  open: boolean
  onClose: () => void
}

const PERFIL_OPTIONS = [
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'lider_equipe', label: 'Lider de Equipe' },
  { value: 'voluntario', label: 'Voluntario' },
]

export function AdicionarUsuarioModal({
  eventoId,
  open,
  onClose,
}: AdicionarUsuarioModalProps) {
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState('voluntario')
  const [emailErro, setEmailErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function resetForm() {
    setEmail('')
    setPerfil('voluntario')
    setEmailErro('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleAdicionar() {
    if (!email.trim()) {
      setEmailErro('E-mail e obrigatorio')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErro('Informe um e-mail valido')
      return
    }
    setEmailErro('')
    setCarregando(true)
    try {
      await adicionarUsuario(eventoId, email.trim(), perfil)
      resetForm()
      onClose()
    } catch {
      setEmailErro('Nao foi possivel adicionar o colaborador. Verifique o e-mail e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adicionar colaborador"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={carregando}>
            Cancelar
          </Button>
          <Button variant="primary" loading={carregando} onClick={handleAdicionar}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="E-mail do colaborador"
          type="email"
          placeholder="colaborador@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailErro}
        />
        <Select
          label="Perfil"
          options={PERFIL_OPTIONS}
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
        />
      </div>
    </Modal>
  )
}
