import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localDb } from '../db/localDb'

/**
 * Expoe o estado atual do processo de sincronizacao.
 * Usa `useLiveQuery` do dexie-react-hooks para reatividade automatica.
 */
export function useSyncStatus() {
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimaSync, setUltimaSync] = useState<Date | null>(null)

  const pendentes =
    useLiveQuery(
      () => localDb.syncQueue.where('sincronizado').equals(0).count(),
      [],
      0,
    ) ?? 0

  const conflitos =
    useLiveQuery(
      () =>
        localDb.conflitos
          .filter((c) => !c.resolvidoEm)
          .count(),
      [],
      0,
    ) ?? 0

  return {
    pendentes,
    conflitos,
    sincronizando,
    ultimaSync,
    setSincronizando,
    setUltimaSync,
  }
}
