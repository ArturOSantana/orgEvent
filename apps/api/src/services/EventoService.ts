import { eq, and, ilike, or, sql, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  eventos,
  eventoUsuarios,
  usuarios,
  participantes,
  equipes,
  equipeVoluntarios,
  inscricoes,
} from '../db/schema/index.js'

export interface FiltrosEvento {
  status?: string
  busca?: string
  page?: number
  limit?: number
}

export class EventoService {
  async listar(usuarioId: string, filtros: FiltrosEvento = {}) {
    const page = Math.max(1, filtros.page ?? 1)
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20))
    const offset = (page - 1) * limit

    // Subquery: IDs dos eventos que o usuario tem acesso
    const eventoIds = await db
      .select({ eventoId: eventoUsuarios.eventoId })
      .from(eventoUsuarios)
      .where(eq(eventoUsuarios.usuarioId, usuarioId))

    if (eventoIds.length === 0) {
      return { data: [], total: 0, page, limit }
    }

    const ids = eventoIds.map((e) => e.eventoId)

    const conditions = [inArray(eventos.id, ids)]

    if (filtros.status) {
      conditions.push(eq(eventos.status, filtros.status))
    }
    if (filtros.busca) {
      conditions.push(
        or(
          ilike(eventos.nome, `%${filtros.busca}%`),
          ilike(sql`coalesce(${eventos.local}, '')`, `%${filtros.busca}%`),
        )!,
      )
    }

    const where = and(...conditions)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventos)
      .where(where)

    const data = await db
      .select()
      .from(eventos)
      .where(where)
      .orderBy(eventos.dataInicio)
      .limit(limit)
      .offset(offset)

    return { data, total: count, page, limit }
  }

  async buscarPorId(id: string, usuarioId: string) {
    const [vinculo] = await db
      .select()
      .from(eventoUsuarios)
      .where(and(eq(eventoUsuarios.eventoId, id), eq(eventoUsuarios.usuarioId, usuarioId)))
      .limit(1)

    if (!vinculo) return null

    const [evento] = await db.select().from(eventos).where(eq(eventos.id, id)).limit(1)
    if (!evento) return null

    const colaboradores = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        perfil: eventoUsuarios.perfil,
      })
      .from(eventoUsuarios)
      .innerJoin(usuarios, eq(usuarios.id, eventoUsuarios.usuarioId))
      .where(eq(eventoUsuarios.eventoId, id))

    const [{ count: totalParticipantes }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participantes)
      .where(eq(participantes.eventoId, id))

    const [{ count: totalEquipes }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(equipes)
      .where(eq(equipes.eventoId, id))

    const [{ count: totalVoluntarios }] = await db
      .select({ count: sql<number>`count(distinct ${equipeVoluntarios.voluntarioId})::int` })
      .from(equipeVoluntarios)
      .innerJoin(equipes, eq(equipes.id, equipeVoluntarios.equipeId))
      .where(eq(equipes.eventoId, id))

    const [{ count: totalInscricoes }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inscricoes)
      .where(and(eq(inscricoes.eventoId, id), sql`${inscricoes.status} != 'cancelado'`))

    return {
      ...evento,
      colaboradores,
      totalParticipantes: totalParticipantes ?? 0,
      totalEquipes: totalEquipes ?? 0,
      totalVoluntarios: totalVoluntarios ?? 0,
      totalInscricoes: totalInscricoes ?? 0,
    }
  }

  async criar(dados: { nome: string; tipo: string; descricao?: string; dataInicio: Date; dataFim: Date; local?: string; capacidade?: number; obs?: string }, usuarioId: string) {
    const [evento] = await db
      .insert(eventos)
      .values({ ...dados, status: 'planejamento' })
      .returning()

    // Vincula o criador como coordenador
    await db.insert(eventoUsuarios).values({
      eventoId: evento.id,
      usuarioId,
      perfil: 'coordenador',
    })

    return evento
  }

  async atualizar(id: string, dados: Partial<{ nome: string; tipo: string; descricao: string; dataInicio: Date; dataFim: Date; local: string; capacidade: number; status: string; obs: string }>) {
    const [updated] = await db
      .update(eventos)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(eventos.id, id))
      .returning()
    return updated ?? null
  }

  async arquivar(id: string) {
    const [updated] = await db
      .update(eventos)
      .set({ status: 'arquivado', atualizadoEm: new Date() })
      .where(eq(eventos.id, id))
      .returning()
    return updated ?? null
  }

  async desarquivar(id: string) {
    const [updated] = await db
      .update(eventos)
      .set({ status: 'planejamento', atualizadoEm: new Date() })
      .where(eq(eventos.id, id))
      .returning()
    return updated ?? null
  }

  async adicionarUsuario(eventoId: string, email: string, perfil: string) {
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1)

    if (!usuario) throw new Error('USUARIO_NAO_ENCONTRADO')

    const [existente] = await db
      .select()
      .from(eventoUsuarios)
      .where(and(eq(eventoUsuarios.eventoId, eventoId), eq(eventoUsuarios.usuarioId, usuario.id)))
      .limit(1)

    if (existente) {
      const [updated] = await db
        .update(eventoUsuarios)
        .set({ perfil })
        .where(and(eq(eventoUsuarios.eventoId, eventoId), eq(eventoUsuarios.usuarioId, usuario.id)))
        .returning()
      return updated
    }

    const [vinculo] = await db
      .insert(eventoUsuarios)
      .values({ eventoId, usuarioId: usuario.id, perfil })
      .returning()
    return vinculo
  }
}

export const eventoService = new EventoService()
