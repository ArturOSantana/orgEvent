import { eq, and, ilike, or, sql, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  eventos,
  eventoUsuarios,
  usuarios,
  participantes,
  equipes,
  equipeVoluntarios,
  funcoes,
  voluntarios,
  fases,
  horarios,
  materiais,
  observacoes,
  inscricoes,
  formulariosInscricao,
  camposFormulario,
  respostasInscricao,
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

  async apagar(id: string) {
    // Deleta em ordem para respeitar as foreign keys
    await db.transaction(async (tx) => {
      // 1. Buscar formulario do evento (pode nao existir)
      const [formulario] = await tx
        .select({ id: formulariosInscricao.id })
        .from(formulariosInscricao)
        .where(eq(formulariosInscricao.eventoId, id))
        .limit(1)

      if (formulario) {
        // 2. Respostas de inscricao (FK → inscricoes + campos_formulario)
        const idsInscricoes = await tx
          .select({ id: inscricoes.id })
          .from(inscricoes)
          .where(eq(inscricoes.eventoId, id))
        if (idsInscricoes.length > 0) {
          await tx
            .delete(respostasInscricao)
            .where(inArray(respostasInscricao.inscricaoId, idsInscricoes.map((i) => i.id)))
        }
        // 3. Inscricoes
        await tx.delete(inscricoes).where(eq(inscricoes.eventoId, id))
        // 4. Campos do formulario
        await tx.delete(camposFormulario).where(eq(camposFormulario.formularioId, formulario.id))
        // 5. Formulario
        await tx.delete(formulariosInscricao).where(eq(formulariosInscricao.id, formulario.id))
      }

      // 6. Buscar IDs das equipes para deletar equipe_voluntarios e voluntarios
      const idsEquipes = await tx
        .select({ id: equipes.id })
        .from(equipes)
        .where(eq(equipes.eventoId, id))

      if (idsEquipes.length > 0) {
        const equipeIds = idsEquipes.map((e) => e.id)
        // 7. Buscar voluntarios vinculados antes de remover o vinculo
        const idsVoluntarios = await tx
          .select({ voluntarioId: equipeVoluntarios.voluntarioId })
          .from(equipeVoluntarios)
          .where(inArray(equipeVoluntarios.equipeId, equipeIds))
        // 8. Remover vinculos equipe_voluntarios
        await tx.delete(equipeVoluntarios).where(inArray(equipeVoluntarios.equipeId, equipeIds))
        // 9. Remover voluntarios (sem outro evento vinculado via equipe)
        if (idsVoluntarios.length > 0) {
          const volIds = [...new Set(idsVoluntarios.map((v) => v.voluntarioId))]
          await tx.delete(voluntarios).where(inArray(voluntarios.id, volIds))
        }
      }

      // 10. Participantes
      await tx.delete(participantes).where(eq(participantes.eventoId, id))
      // 11. Equipes
      await tx.delete(equipes).where(eq(equipes.eventoId, id))
      // 12. Funcoes
      await tx.delete(funcoes).where(eq(funcoes.eventoId, id))
      // 13. Horarios (antes das fases pois faseId e nullable, mas horarios referenciam eventos)
      await tx.delete(horarios).where(eq(horarios.eventoId, id))
      // 14. Fases
      await tx.delete(fases).where(eq(fases.eventoId, id))
      // 15. Materiais e observacoes
      await tx.delete(materiais).where(eq(materiais.eventoId, id))
      await tx.delete(observacoes).where(eq(observacoes.eventoId, id))
      // 16. Vinculos evento_usuarios
      await tx.delete(eventoUsuarios).where(eq(eventoUsuarios.eventoId, id))
      // 17. Evento
      await tx.delete(eventos).where(eq(eventos.id, id))
    })
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
