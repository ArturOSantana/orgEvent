import { eq, and, sql, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  eventos,
  eventoUsuarios,
  fases,
  horarios,
  equipes,
  voluntarios,
  participantes,
  materiais,
  observacoes,
} from '../db/schema/index.js'

export interface OperacaoSync {
  clienteId: string
  entidade: string
  operacao: string
  payload: Record<string, unknown>
  clienteTimestamp: string
}

export interface ConflitoPorEntidade {
  clienteId: string
  entidade: string
  tipo: 'versao_mais_recente_no_servidor'
  servidorUpdatedAt: string
  clienteTimestamp: string
}

export interface ErroOperacao {
  clienteId: string
  motivo: string
}

export interface ResultadoSync {
  processadas: number
  conflitos: ConflitoPorEntidade[]
  erros: ErroOperacao[]
}

const ENTIDADES_VALIDAS = [
  'evento',
  'fase',
  'horario',
  'equipe',
  'voluntario',
  'participante',
  'material',
  'observacao',
] as const

type EntidadeValida = (typeof ENTIDADES_VALIDAS)[number]

function isEntidadeValida(e: string): e is EntidadeValida {
  return (ENTIDADES_VALIDAS as readonly string[]).includes(e)
}

function getEventoIdDaEntidade(entidade: EntidadeValida, payload: Record<string, unknown>): string | null {
  // Para todas as entidades, o eventoId deve estar no payload para validacao de acesso
  const id = payload['eventoId'] ?? payload['evento_id']
  return typeof id === 'string' ? id : null
}

export class SyncService {
  /**
   * Processa uma lista de operacoes de sincronizacao offline.
   * Operacoes invalidas sao coletadas como erros e puladas — as validas sao commitadas.
   */
  async processar(usuarioId: string, operacoes: OperacaoSync[]): Promise<ResultadoSync> {
    const conflitos: ConflitoPorEntidade[] = []
    const erros: ErroOperacao[] = []
    let processadas = 0

    // Coleta todos os eventoIds referenciados para validar acesso uma vez so
    const eventoIdsReferenciados = new Set<string>()
    for (const op of operacoes) {
      if (!isEntidadeValida(op.entidade)) continue
      const eventoId = getEventoIdDaEntidade(op.entidade, op.payload)
      if (eventoId) eventoIdsReferenciados.add(eventoId)
    }

    // Verifica quais eventoIds o usuario tem acesso
    const eventoIdsPermitidos = new Set<string>()
    if (eventoIdsReferenciados.size > 0) {
      const ids = Array.from(eventoIdsReferenciados)
      const vinculos = await db
        .select({ eventoId: eventoUsuarios.eventoId })
        .from(eventoUsuarios)
        .where(
          and(
            eq(eventoUsuarios.usuarioId, usuarioId),
            inArray(eventoUsuarios.eventoId, ids),
          ),
        )
      for (const v of vinculos) eventoIdsPermitidos.add(v.eventoId)
    }

    // Processa cada operacao individualmente dentro de transacoes separadas
    // para resiliencia: falhas em uma nao afetam as outras
    for (const op of operacoes) {
      // Validacao basica
      if (!isEntidadeValida(op.entidade)) {
        erros.push({ clienteId: op.clienteId, motivo: `Entidade desconhecida: ${op.entidade}` })
        continue
      }

      if (!['criar', 'atualizar', 'remover'].includes(op.operacao)) {
        erros.push({ clienteId: op.clienteId, motivo: `Operacao desconhecida: ${op.operacao}` })
        continue
      }

      if (!op.payload || typeof op.payload !== 'object') {
        erros.push({ clienteId: op.clienteId, motivo: 'Payload ausente ou invalido' })
        continue
      }

      // Valida acesso ao evento — exceto para entidade 'evento' com operacao 'criar'
      if (!(op.entidade === 'evento' && op.operacao === 'criar')) {
        const eventoId = getEventoIdDaEntidade(op.entidade, op.payload)
        // Para 'evento', o eventoId e o proprio id
        const idEvento = op.entidade === 'evento' ? (op.payload['id'] as string | undefined) : eventoId
        if (!idEvento || !eventoIdsPermitidos.has(idEvento)) {
          erros.push({ clienteId: op.clienteId, motivo: 'Acesso negado ao evento relacionado' })
          continue
        }
      }

      try {
        await db.transaction(async (tx) => {
          const resultado = await this._aplicarOperacao(tx, op)
          if (resultado.conflito) {
            conflitos.push(resultado.conflito)
          } else {
            processadas++
          }
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        erros.push({ clienteId: op.clienteId, motivo: msg })
      }
    }

    return { processadas, conflitos, erros }
  }

  private async _aplicarOperacao(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    op: OperacaoSync,
  ): Promise<{ conflito?: ConflitoPorEntidade }> {
    const entidade = op.entidade as EntidadeValida
    const payload = op.payload
    const clienteTimestamp = new Date(op.clienteTimestamp)

    if (op.operacao === 'criar') {
      return this._criar(tx, entidade, payload)
    }

    if (op.operacao === 'atualizar') {
      return this._atualizar(tx, entidade, payload, op.clienteId, clienteTimestamp, op.clienteTimestamp)
    }

    if (op.operacao === 'remover') {
      return this._remover(tx, entidade, payload)
    }

    return {}
  }

  private async _criar(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    entidade: EntidadeValida,
    payload: Record<string, unknown>,
  ): Promise<{ conflito?: ConflitoPorEntidade }> {
    // ON CONFLICT DO NOTHING para idempotencia por UUID
    switch (entidade) {
      case 'evento':
        await tx.insert(eventos).values(payload as never).onConflictDoNothing()
        break
      case 'fase':
        await tx.insert(fases).values(payload as never).onConflictDoNothing()
        break
      case 'horario':
        await tx.insert(horarios).values(payload as never).onConflictDoNothing()
        break
      case 'equipe':
        await tx.insert(equipes).values(payload as never).onConflictDoNothing()
        break
      case 'voluntario':
        await tx.insert(voluntarios).values(payload as never).onConflictDoNothing()
        break
      case 'participante':
        await tx.insert(participantes).values(payload as never).onConflictDoNothing()
        break
      case 'material':
        await tx.insert(materiais).values(payload as never).onConflictDoNothing()
        break
      case 'observacao':
        await tx.insert(observacoes).values(payload as never).onConflictDoNothing()
        break
    }
    return {}
  }

  private async _atualizar(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    entidade: EntidadeValida,
    payload: Record<string, unknown>,
    clienteId: string,
    clienteTimestamp: Date,
    clienteTimestampIso: string,
  ): Promise<{ conflito?: ConflitoPorEntidade }> {
    const id = payload['id']
    if (typeof id !== 'string') throw new Error('ID ausente no payload para atualizar')

    // Busca atualizadoEm atual no servidor
    const servidorUpdatedAt = await this._buscarAtualizadoEm(tx, entidade, id)
    if (servidorUpdatedAt === null) throw new Error(`${entidade} com id ${id} nao encontrado`)

    // Deteccao de conflito: servidor mais recente que o cliente
    if (servidorUpdatedAt > clienteTimestamp) {
      return {
        conflito: {
          clienteId,
          entidade,
          tipo: 'versao_mais_recente_no_servidor',
          servidorUpdatedAt: servidorUpdatedAt.toISOString(),
          clienteTimestamp: clienteTimestampIso,
        },
      }
    }

    // Aplica a atualizacao — copia o payload sem 'id' e com atualizadoEm atualizado
    const dadosAtualizar: Record<string, unknown> = { ...payload, atualizadoEm: new Date() }
    delete dadosAtualizar['id']

    switch (entidade) {
      case 'evento':
        await tx.update(eventos).set(dadosAtualizar as never).where(eq(eventos.id, id))
        break
      case 'fase':
        await tx.update(fases).set(dadosAtualizar as never).where(eq(fases.id, id))
        break
      case 'horario':
        await tx.update(horarios).set(dadosAtualizar as never).where(eq(horarios.id, id))
        break
      case 'equipe':
        await tx.update(equipes).set(dadosAtualizar as never).where(eq(equipes.id, id))
        break
      case 'voluntario':
        await tx.update(voluntarios).set(dadosAtualizar as never).where(eq(voluntarios.id, id))
        break
      case 'participante':
        await tx.update(participantes).set(dadosAtualizar as never).where(eq(participantes.id, id))
        break
      case 'material':
        await tx.update(materiais).set(dadosAtualizar as never).where(eq(materiais.id, id))
        break
      case 'observacao':
        await tx.update(observacoes).set(dadosAtualizar as never).where(eq(observacoes.id, id))
        break
    }

    return {}
  }

  private async _remover(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    entidade: EntidadeValida,
    payload: Record<string, unknown>,
  ): Promise<{ conflito?: ConflitoPorEntidade }> {
    const id = payload['id']
    if (typeof id !== 'string') throw new Error('ID ausente no payload para remover')

    // horario: delete fisico (sem campo arquivadoEm)
    // demais entidades com atualizadoEm: soft delete via status='arquivado' onde suportado, ou delete fisico
    switch (entidade) {
      case 'horario':
        await tx.delete(horarios).where(eq(horarios.id, id))
        break
      case 'evento':
        await tx.update(eventos).set({ status: 'arquivado', atualizadoEm: new Date() }).where(eq(eventos.id, id))
        break
      case 'fase':
        await tx.delete(fases).where(eq(fases.id, id))
        break
      case 'equipe':
        await tx.delete(equipes).where(eq(equipes.id, id))
        break
      case 'voluntario':
        await tx.delete(voluntarios).where(eq(voluntarios.id, id))
        break
      case 'participante':
        await tx.delete(participantes).where(eq(participantes.id, id))
        break
      case 'material':
        await tx.delete(materiais).where(eq(materiais.id, id))
        break
      case 'observacao':
        await tx.delete(observacoes).where(eq(observacoes.id, id))
        break
    }

    return {}
  }

  private async _buscarAtualizadoEm(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    entidade: EntidadeValida,
    id: string,
  ): Promise<Date | null> {
    type RowAtualizadoEm = { atualizadoEm: Date }

    let rows: RowAtualizadoEm[] = []

    switch (entidade) {
      case 'evento':
        rows = await tx.select({ atualizadoEm: eventos.atualizadoEm }).from(eventos).where(eq(eventos.id, id)).limit(1)
        break
      case 'fase':
        rows = await tx.select({ atualizadoEm: fases.atualizadoEm }).from(fases).where(eq(fases.id, id)).limit(1)
        break
      case 'horario':
        rows = await tx.select({ atualizadoEm: horarios.atualizadoEm }).from(horarios).where(eq(horarios.id, id)).limit(1)
        break
      case 'equipe':
        rows = await tx.select({ atualizadoEm: equipes.atualizadoEm }).from(equipes).where(eq(equipes.id, id)).limit(1)
        break
      case 'voluntario':
        rows = await tx.select({ atualizadoEm: voluntarios.atualizadoEm }).from(voluntarios).where(eq(voluntarios.id, id)).limit(1)
        break
      case 'participante':
        rows = await tx.select({ atualizadoEm: participantes.atualizadoEm }).from(participantes).where(eq(participantes.id, id)).limit(1)
        break
      case 'material':
        rows = await tx.select({ atualizadoEm: materiais.atualizadoEm }).from(materiais).where(eq(materiais.id, id)).limit(1)
        break
      case 'observacao':
        rows = await tx.select({ atualizadoEm: observacoes.atualizadoEm }).from(observacoes).where(eq(observacoes.id, id)).limit(1)
        break
    }

    return rows[0]?.atualizadoEm ?? null
  }
}

export const syncService = new SyncService()
