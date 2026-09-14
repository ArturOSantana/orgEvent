import { eq, and, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { participantes } from '../db/schema/index.js'

export interface FiltrosParticipante {
  busca?: string
  equipeId?: string
  status?: string
  page?: number
  limit?: number
}

export class ParticipanteService {
  async listar(eventoId: string, filtros: FiltrosParticipante = {}) {
    const page = Math.max(1, filtros.page ?? 1)
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions = [eq(participantes.eventoId, eventoId)]

    if (filtros.status) {
      conditions.push(eq(participantes.status, filtros.status))
    }
    if (filtros.equipeId) {
      conditions.push(eq(participantes.equipeId, filtros.equipeId))
    }
    if (filtros.busca) {
      conditions.push(
        or(
          ilike(participantes.nome, `%${filtros.busca}%`),
          ilike(sql`coalesce(${participantes.email}, '')`, `%${filtros.busca}%`),
        )!,
      )
    }

    const where = and(...conditions)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participantes)
      .where(where)

    const data = await db
      .select()
      .from(participantes)
      .where(where)
      .orderBy(participantes.nome)
      .limit(limit)
      .offset(offset)

    return { data, total: count, page, limit }
  }

  async buscarPorId(id: string) {
    const [p] = await db.select().from(participantes).where(eq(participantes.id, id)).limit(1)
    return p ?? null
  }

  async criar(
    eventoId: string,
    dados: { nome: string; email?: string; telefone?: string; obs?: string; status?: string; equipeId?: string },
  ) {
    const [p] = await db
      .insert(participantes)
      .values({ eventoId, ...dados, status: dados.status ?? 'confirmado' })
      .returning()
    return p
  }

  async atualizar(
    id: string,
    dados: Partial<{ nome: string; email: string; telefone: string; obs: string; status: string; equipeId: string }>,
  ) {
    const [updated] = await db
      .update(participantes)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async checkin(id: string) {
    const [updated] = await db
      .update(participantes)
      .set({ status: 'confirmado', checkinEm: new Date(), atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async alocarEquipe(id: string, equipeId: string) {
    const [updated] = await db
      .update(participantes)
      .set({ equipeId, atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async registrarCheckin(id: string) {
    const [updated] = await db
      .update(participantes)
      .set({ checkinEm: new Date(), atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async importarCsv(eventoId: string, lista: Array<{ nome: string; email?: string; telefone?: string }>) {
    if (lista.length === 0) return []
    const rows = lista.map((p) => ({
      eventoId,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      status: 'confirmado' as const,
    }))
    return db.insert(participantes).values(rows).returning()
  }
}

export const participanteService = new ParticipanteService()
