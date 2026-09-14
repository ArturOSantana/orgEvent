import { localDb, type SyncQueueItem, type SyncConflito } from '../db/localDb'
import { api } from './api'

// Resposta esperada do endpoint POST /api/sync
interface SyncResponseItem {
  clienteId: string
  status: 'ok' | 'conflito' | 'erro'
  conflito?: {
    tipo: string
    servidorUpdatedAt: string
  }
  erro?: string
}

interface SyncResult {
  processadas: number
  conflitos: number
  erros: number
}

const BATCH_SIZE = 100
const MAX_TENTATIVAS = 3

/**
 * Adiciona uma operacao na fila de sincronizacao local.
 * Ignora se ja existir um item com o mesmo `clienteId` (idempotencia).
 */
async function adicionarNaFila(
  operacao: Omit<SyncQueueItem, 'id' | 'tentativas' | 'sincronizado'>,
): Promise<void> {
  const existente = await localDb.syncQueue
    .where('clienteId')
    .equals(operacao.clienteId)
    .first()

  if (existente) return

  await localDb.syncQueue.add({
    ...operacao,
    tentativas: 0,
    sincronizado: false,
  })
}

/**
 * Processa a fila de pendentes em batches de ate 100 itens.
 * Envia para POST /api/sync e trata respostas individuais.
 */
async function sincronizar(): Promise<SyncResult> {
  const result: SyncResult = { processadas: 0, conflitos: 0, erros: 0 }

  const pendentes = await localDb.syncQueue
    .where('sincronizado')
    .equals(0)
    .toArray()

  if (pendentes.length === 0) return result

  // Processa em batches
  for (let i = 0; i < pendentes.length; i += BATCH_SIZE) {
    const batch = pendentes.slice(i, i + BATCH_SIZE)

    let respostas: SyncResponseItem[]

    try {
      const { data } = await api.post<SyncResponseItem[]>('/api/sync', { operacoes: batch })
      respostas = data
    } catch {
      // Falha de rede: incrementa tentativas em todos do batch
      await localDb.transaction('rw', localDb.syncQueue, async () => {
        for (const item of batch) {
          if (item.id === undefined) continue
          const novasTentativas = item.tentativas + 1
          if (novasTentativas >= MAX_TENTATIVAS) {
            await localDb.syncQueue.update(item.id, {
              tentativas: novasTentativas,
              sincronizado: true,
              erro: 'Falha de rede após múltiplas tentativas',
            })
          } else {
            await localDb.syncQueue.update(item.id, {
              tentativas: novasTentativas,
            })
          }
          result.erros++
        }
      })
      continue
    }

    // Mapeia respostas pelo clienteId
    const mapaRespostas = new Map<string, SyncResponseItem>()
    for (const r of respostas) {
      mapaRespostas.set(r.clienteId, r)
    }

    await localDb.transaction(
      'rw',
      [localDb.syncQueue, localDb.conflitos],
      async () => {
        for (const item of batch) {
          if (item.id === undefined) continue
          const resposta = mapaRespostas.get(item.clienteId)

          if (!resposta || resposta.status === 'ok') {
            await localDb.syncQueue.update(item.id, { sincronizado: true })
            result.processadas++
          } else if (resposta.status === 'conflito') {
            await localDb.syncQueue.update(item.id, { sincronizado: true })
            const conflito: SyncConflito = {
              clienteId: item.clienteId,
              entidade: item.entidade,
              tipo: resposta.conflito?.tipo ?? 'desconhecido',
              servidorUpdatedAt: resposta.conflito?.servidorUpdatedAt ?? '',
              clienteTimestamp: item.clienteTimestamp,
            }
            await localDb.conflitos.add(conflito)
            result.conflitos++
          } else {
            // status === 'erro'
            const novasTentativas = item.tentativas + 1
            if (novasTentativas >= MAX_TENTATIVAS) {
              await localDb.syncQueue.update(item.id, {
                tentativas: novasTentativas,
                sincronizado: true,
                erro: resposta.erro ?? 'Erro desconhecido',
              })
            } else {
              await localDb.syncQueue.update(item.id, {
                tentativas: novasTentativas,
                erro: resposta.erro,
              })
            }
            result.erros++
          }
        }
      },
    )
  }

  return result
}

/**
 * Wrapper que verifica conectividade antes de sincronizar.
 */
async function sincronizarSeOnline(): Promise<SyncResult | null> {
  if (!navigator.onLine) return null
  return sincronizar()
}

/**
 * Resolve um conflito existente.
 * - `manter_servidor`: apenas marca como resolvido
 * - `manter_cliente`: re-adiciona na fila e marca como resolvido
 */
async function resolverConflito(
  conflitoId: number,
  resolucao: 'manter_servidor' | 'manter_cliente',
): Promise<void> {
  const conflito = await localDb.conflitos.get(conflitoId)
  if (!conflito) return

  if (resolucao === 'manter_cliente') {
    // Busca o item original na fila (ja marcado como sincronizado)
    const original = await localDb.syncQueue
      .where('clienteId')
      .equals(conflito.clienteId)
      .first()

    if (original) {
      // Re-adiciona como nova operacao com novo clienteId derivado
      const novoClienteId = `${conflito.clienteId}-reenvio-${Date.now()}`
      await localDb.syncQueue.add({
        clienteId: novoClienteId,
        entidade: original.entidade,
        operacao: original.operacao,
        payload: original.payload,
        clienteTimestamp: new Date().toISOString(),
        tentativas: 0,
        sincronizado: false,
      })
    }
  }

  await localDb.conflitos.update(conflitoId, {
    resolvidoEm: new Date().toISOString(),
  })
}

export const syncService = {
  adicionarNaFila,
  sincronizar,
  sincronizarSeOnline,
  resolverConflito,
}
