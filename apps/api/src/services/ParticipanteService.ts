import { eq, and, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { participantes, equipes, quartos } from '../db/schema/index.js'

export interface FiltrosParticipante {
  busca?: string
  equipeId?: string
  quartoId?: string
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
    if (filtros.quartoId) {
      conditions.push(eq(participantes.quartoId, filtros.quartoId))
    }
    if (filtros.busca) {
      conditions.push(
        or(
          ilike(participantes.nome, `%${filtros.busca}%`),
          ilike(sql`coalesce(${participantes.email}, '')`, `%${filtros.busca}%`),
          ilike(sql`coalesce(${participantes.telefone}, '')`, `%${filtros.busca}%`),
        )!,
      )
    }

    const where = and(...conditions)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participantes)
      .where(where)

    const rows = await db
      .select({
        id: participantes.id,
        eventoId: participantes.eventoId,
        nome: participantes.nome,
        telefone: participantes.telefone,
        email: participantes.email,
        obs: participantes.obs,
        status: participantes.status,
        equipeId: participantes.equipeId,
        quartoId: participantes.quartoId,
        inscricaoId: participantes.inscricaoId,
        checkinEm: participantes.checkinEm,
        criadoEm: participantes.criadoEm,
        atualizadoEm: participantes.atualizadoEm,
        equipeNome: equipes.nome,
        quartoNome: quartos.nome,
      })
      .from(participantes)
      .leftJoin(equipes, eq(participantes.equipeId, equipes.id))
      .leftJoin(quartos, eq(participantes.quartoId, quartos.id))
      .where(where)
      .orderBy(participantes.nome)
      .limit(limit)
      .offset(offset)

    const data = rows.map((r) => ({
      id: r.id,
      eventoId: r.eventoId,
      nome: r.nome,
      telefone: r.telefone,
      email: r.email,
      obs: r.obs,
      status: r.status,
      equipeId: r.equipeId,
      quartoId: r.quartoId,
      inscricaoId: r.inscricaoId,
      checkinEm: r.checkinEm,
      criadoEm: r.criadoEm,
      atualizadoEm: r.atualizadoEm,
      equipe: r.equipeId && r.equipeNome ? { id: r.equipeId, nome: r.equipeNome } : undefined,
      quarto: r.quartoId && r.quartoNome ? { id: r.quartoId, nome: r.quartoNome } : undefined,
    }))

    return { data, total: count, page, limit }
  }

  async buscarPorId(id: string) {
    const [p] = await db.select().from(participantes).where(eq(participantes.id, id)).limit(1)
    return p ?? null
  }

  async criar(
    eventoId: string,
    dados: {
      nome: string
      email?: string
      telefone?: string
      obs?: string
      status?: string
      equipeId?: string
      quartoId?: string
      inscricaoId?: string
    },
  ) {
    const [p] = await db
      .insert(participantes)
      .values({ eventoId, ...dados, status: dados.status ?? 'confirmado' })
      .returning()
    return p
  }

  async atualizar(
    id: string,
    dados: Partial<{
      nome: string
      email: string | null
      telefone: string | null
      obs: string | null
      status: string
      equipeId: string | null
      quartoId: string | null
    }>,
  ) {
    const [updated] = await db
      .update(participantes)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async remover(id: string) {
    const [deleted] = await db
      .delete(participantes)
      .where(eq(participantes.id, id))
      .returning()
    return deleted ?? null
  }

  async checkin(id: string) {
    const [updated] = await db
      .update(participantes)
      .set({ status: 'confirmado', checkinEm: new Date(), atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async alocarEquipe(id: string, equipeId: string | null) {
    const [updated] = await db
      .update(participantes)
      .set({ equipeId: equipeId ?? null, atualizadoEm: new Date() })
      .where(eq(participantes.id, id))
      .returning()
    return updated ?? null
  }

  async alocarQuarto(id: string, quartoId: string | null) {
    const [updated] = await db
      .update(participantes)
      .set({ quartoId: quartoId ?? null, atualizadoEm: new Date() })
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
