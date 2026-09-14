import Dexie, { type Table } from 'dexie'

// Tipos das entidades em cache local
export interface LocalEvento { id: string; [key: string]: unknown }
export interface LocalFase { id: string; eventoId: string; [key: string]: unknown }
export interface LocalHorario { id: string; eventoId: string; faseId?: string; [key: string]: unknown }
export interface LocalEquipe { id: string; eventoId: string; [key: string]: unknown }
export interface LocalVoluntario { id: string; [key: string]: unknown }
export interface LocalParticipante { id: string; eventoId: string; [key: string]: unknown }
export interface LocalMaterial { id: string; eventoId: string; [key: string]: unknown }
export interface LocalObservacao { id: string; eventoId: string; [key: string]: unknown }

// Operacao na fila de sync
export interface SyncQueueItem {
  id?: number              // auto-increment (chave primária)
  clienteId: string        // UUID único para idempotência
  entidade: string
  operacao: 'criar' | 'atualizar' | 'remover'
  payload: Record<string, unknown>
  clienteTimestamp: string
  tentativas: number
  sincronizado: boolean
  erro?: string
}

// Conflito reportado pelo servidor
export interface SyncConflito {
  id?: number
  clienteId: string
  entidade: string
  tipo: string
  servidorUpdatedAt: string
  clienteTimestamp: string
  resolvidoEm?: string
}

class LocalDatabase extends Dexie {
  eventos!: Table<LocalEvento>
  fases!: Table<LocalFase>
  horarios!: Table<LocalHorario>
  equipes!: Table<LocalEquipe>
  voluntarios!: Table<LocalVoluntario>
  participantes!: Table<LocalParticipante>
  materiais!: Table<LocalMaterial>
  observacoes!: Table<LocalObservacao>
  syncQueue!: Table<SyncQueueItem>
  conflitos!: Table<SyncConflito>

  constructor() {
    super('GestorEventosDB')
    this.version(1).stores({
      eventos: 'id',
      fases: 'id, eventoId',
      horarios: 'id, eventoId, faseId',
      equipes: 'id, eventoId',
      voluntarios: 'id',
      participantes: 'id, eventoId',
      materiais: 'id, eventoId',
      observacoes: 'id, eventoId',
      syncQueue: '++id, clienteId, sincronizado, entidade',
      conflitos: '++id, clienteId, resolvidoEm',
    })
  }
}

export const localDb = new LocalDatabase()
