import { useState } from 'react'
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DisconnectOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useConnection } from '../../hooks/useConnection'
import { useSyncStatus } from '../../hooks/useSyncStatus'
import { syncService } from '../../services/syncService'
import { ConflitosModal } from './ConflitosModal'

/**
 * Indicador de status de sincronizacao para o header.
 * Mostra estado da conexao, pendentes e conflitos.
 */
export function SyncStatus() {
  const { online } = useConnection()
  const { pendentes, conflitos, sincronizando, setSincronizando, setUltimaSync } = useSyncStatus()
  const [conflitosAberto, setConflitosAberto] = useState(false)

  async function handleForceSyncClick() {
    if (!online || sincronizando) return
    setSincronizando(true)
    try {
      await syncService.sincronizar()
      setUltimaSync(new Date())
    } finally {
      setSincronizando(false)
    }
  }

  // Offline
  if (!online) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 select-none">
        <DisconnectOutlined />
        <span className="hidden sm:inline">Sem conexão</span>
      </span>
    )
  }

  // Conflitos pendentes (prioridade sobre outras mensagens)
  if (conflitos > 0) {
    return (
      <>
        <button
          onClick={() => setConflitosAberto(true)}
          className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 transition-colors"
          title={`${conflitos} conflito(s) para resolver`}
        >
          <WarningOutlined />
          <span className="hidden sm:inline">{conflitos} conflito{conflitos > 1 ? 's' : ''}</span>
        </button>

        <ConflitosModal
          open={conflitosAberto}
          onClose={() => setConflitosAberto(false)}
        />
      </>
    )
  }

  // Sincronizando
  if (sincronizando) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500 select-none">
        <LoadingOutlined spin />
        <span className="hidden sm:inline">Sincronizando...</span>
      </span>
    )
  }

  // Pendentes
  if (pendentes > 0) {
    return (
      <button
        onClick={handleForceSyncClick}
        className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors"
        title="Clique para sincronizar agora"
      >
        <CloudUploadOutlined />
        <span className="hidden sm:inline">{pendentes} pendente{pendentes > 1 ? 's' : ''}</span>
      </button>
    )
  }

  // Tudo sincronizado
  return (
    <span className="flex items-center gap-1 text-xs text-green-600 select-none">
      <CheckCircleOutlined />
      <span className="hidden sm:inline">Sincronizado</span>
    </span>
  )
}
