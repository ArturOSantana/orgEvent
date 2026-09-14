import { useLiveQuery } from 'dexie-react-hooks'
import { localDb, type SyncConflito } from '../../db/localDb'
import { syncService } from '../../services/syncService'

interface ConflitosModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal que lista conflitos de sincronizacao nao resolvidos.
 * Permite ao usuario escolher entre manter a versao do servidor
 * ou reenviar a sua propria versao.
 */
export function ConflitosModal({ open, onClose }: ConflitosModalProps) {
  const conflitos =
    useLiveQuery(
      () => localDb.conflitos.filter((c) => !c.resolvidoEm).toArray(),
      [],
      [] as SyncConflito[],
    ) ?? []

  async function handleResolver(
    conflitoId: number,
    resolucao: 'manter_servidor' | 'manter_cliente',
  ) {
    await syncService.resolverConflito(conflitoId, resolucao)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">
            Conflitos de Sincronização
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {conflitos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhum conflito pendente.
            </p>
          ) : (
            <ul className="space-y-4">
              {conflitos.map((conflito) => (
                <li
                  key={conflito.id}
                  className="rounded-md border border-orange-200 bg-orange-50 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {conflito.entidade}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tipo: <span className="font-medium">{conflito.tipo}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 mb-4">
                    <p>
                      <span className="font-medium">Sua versão: </span>
                      {new Date(conflito.clienteTimestamp).toLocaleString('pt-BR')}
                    </p>
                    <p>
                      <span className="font-medium">Versão do servidor: </span>
                      {new Date(conflito.servidorUpdatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolver(conflito.id!, 'manter_servidor')}
                      className="flex-1 text-xs py-1.5 px-3 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Manter servidor
                    </button>
                    <button
                      onClick={() => handleResolver(conflito.id!, 'manter_cliente')}
                      className="flex-1 text-xs py-1.5 px-3 rounded border border-primary-600 bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                      Manter minha versão
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
