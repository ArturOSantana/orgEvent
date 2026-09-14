import { eq, and, ilike, or, sql, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { materiais, observacoes } from '../db/schema/index.js'

export interface FiltrosMaterial {
  status?: string
  busca?: string
  page?: number
  limit?: number
}

export class MaterialService {
  async listar(eventoId: string, filtros: FiltrosMaterial = {}) {
    const page = Math.max(1, filtros.page ?? 1)
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions = [eq(materiais.eventoId, eventoId)]

    if (filtros.status) {
      conditions.push(eq(materiais.status, filtros.status))
    }
    if (filtros.busca) {
      conditions.push(ilike(materiais.nome, `%${filtros.busca}%`))
    }

    const where = and(...conditions)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(materiais)
      .where(where)

    const data = await db
      .select()
      .from(materiais)
      .where(where)
      .orderBy(materiais.nome)
      .limit(limit)
      .offset(offset)

    return { data, total: count, page, limit }
  }

  async criar(
    eventoId: string,
    dados: {
      nome: string
      quantidade?: string
      unidade?: string
      responsavelId?: string
      status?: string
      obs?: string
    },
  ) {
    const [m] = await db
      .insert(materiais)
      .values({ eventoId, ...dados, status: dados.status ?? 'pendente' })
      .returning()
    return m
  }

  async atualizar(
    id: string,
    dados: Partial<{
      nome: string
      quantidade: string
      unidade: string
      responsavelId: string
      status: string
      obs: string
    }>,
  ) {
    const [updated] = await db
      .update(materiais)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(materiais.id, id))
      .returning()
    return updated ?? null
  }

  // ——— Observacoes ———

  async listarObservacoes(eventoId: string) {
    return db
      .select()
      .from(observacoes)
      .where(eq(observacoes.eventoId, eventoId))
      .orderBy(desc(observacoes.criadoEm))
  }

  async criarObservacao(eventoId: string, autorId: string, conteudo: string) {
    const [obs] = await db
      .insert(observacoes)
      .values({ eventoId, autorId, conteudo })
      .returning()
    return obs
  }

  async atualizarObservacao(id: string, conteudo: string) {
    const [updated] = await db
      .update(observacoes)
      .set({ conteudo, atualizadoEm: new Date() })
      .where(eq(observacoes.id, id))
      .returning()
    return updated ?? null
  }
}

export const materialService = new MaterialService()
