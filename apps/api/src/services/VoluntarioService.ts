import { eq, ilike, or, sql, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { voluntarios, equipeVoluntarios, equipes } from '../db/schema/index.js'
import { equipeService } from './EquipeService.js'

export interface FiltrosVoluntario {
  busca?: string
  page?: number
  limit?: number
}

export class VoluntarioService {
  async listar(eventoId: string, filtros: FiltrosVoluntario = {}) {
    const page = Math.max(1, filtros.page ?? 1)
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20))
    const offset = (page - 1) * limit

    // Voluntários vinculados diretamente ao evento ou via equipe
    const eventoCondition = or(
      eq(voluntarios.eventoId, eventoId),
      eq(equipes.eventoId, eventoId),
    )!

    const buscaCondition = filtros.busca
      ? or(
          ilike(voluntarios.nome, `%${filtros.busca}%`),
          ilike(sql`coalesce(${voluntarios.email}, '')`, `%${filtros.busca}%`),
        )
      : undefined

    const where = buscaCondition ? and(eventoCondition, buscaCondition) : eventoCondition

    const rows = await db
      .selectDistinct({
        id: voluntarios.id,
        nome: voluntarios.nome,
        email: voluntarios.email,
        telefone: voluntarios.telefone,
        obs: voluntarios.obs,
        criadoEm: voluntarios.criadoEm,
        atualizadoEm: voluntarios.atualizadoEm,
      })
      .from(voluntarios)
      .leftJoin(equipeVoluntarios, eq(equipeVoluntarios.voluntarioId, voluntarios.id))
      .leftJoin(equipes, eq(equipes.id, equipeVoluntarios.equipeId))
      .where(where)
      .limit(limit)
      .offset(offset)

    const [{ count }] = await db
      .select({ count: sql<number>`count(distinct ${voluntarios.id})::int` })
      .from(voluntarios)
      .leftJoin(equipeVoluntarios, eq(equipeVoluntarios.voluntarioId, voluntarios.id))
      .leftJoin(equipes, eq(equipes.id, equipeVoluntarios.equipeId))
      .where(where)

    return { data: rows, total: count, page, limit }
  }

  async buscarEnriquecido(id: string, eventoId: string) {
    const [vol] = await db
      .select({
        id: voluntarios.id,
        nome: voluntarios.nome,
        email: voluntarios.email,
        telefone: voluntarios.telefone,
        obs: voluntarios.obs,
        slug: voluntarios.slug,
        statusConvite: voluntarios.statusConvite,
        observacaoConvite: voluntarios.observacaoConvite,
        dataResposta: voluntarios.dataResposta,
        visualizadoEm: voluntarios.visualizadoEm,
        tituloConvite: voluntarios.tituloConvite,
        mensagemConvite: voluntarios.mensagemConvite,
        arteUrl: voluntarios.arteUrl,
        criadoEm: voluntarios.criadoEm,
        atualizadoEm: voluntarios.atualizadoEm,
        equipeId: equipeVoluntarios.equipeId,
        funcaoId: equipeVoluntarios.funcaoId,
      })
      .from(voluntarios)
      .leftJoin(
        equipeVoluntarios,
        eq(equipeVoluntarios.voluntarioId, voluntarios.id)
      )
      .leftJoin(
        equipes,
        and(
          eq(equipes.id, equipeVoluntarios.equipeId),
          eq(equipes.eventoId, eventoId)
        )
      )
      .where(eq(voluntarios.id, id))
      .limit(1)

    return vol ?? null
  }

  async buscarOuCriar(
    eventoId: string,
    dados: {
      nome: string
      email?: string
      telefone?: string
      obs?: string
      tituloConvite?: string | null
      mensagemConvite?: string | null
      arteUrl?: string | null
      equipeId?: string | null
      funcaoId?: string | null
    }
  ) {
    let voluntarioId: string

    if (dados.email) {
      const [existente] = await db
        .select()
        .from(voluntarios)
        .where(eq(voluntarios.email, dados.email))
        .limit(1)

      if (existente) {
        voluntarioId = existente.id
        await db
          .update(voluntarios)
          .set({
            eventoId,
            nome: dados.nome,
            telefone: dados.telefone || existente.telefone,
            obs: dados.obs || existente.obs,
            tituloConvite: dados.tituloConvite || existente.tituloConvite,
            mensagemConvite: dados.mensagemConvite || existente.mensagemConvite,
            arteUrl: dados.arteUrl || existente.arteUrl,
            atualizadoEm: new Date(),
          })
          .where(eq(voluntarios.id, voluntarioId))
      }
    }

    if (!voluntarioId!) {
      const [criado] = await db
        .insert(voluntarios)
        .values({
          eventoId,
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          obs: dados.obs,
          tituloConvite: dados.tituloConvite,
          mensagemConvite: dados.mensagemConvite,
          arteUrl: dados.arteUrl,
        })
        .returning()
      voluntarioId = criado.id
    }

    // Gerenciar equipe e função no evento
    if (dados.equipeId) {
      // Limpar outras associações com equipes deste mesmo evento
      const equipesDoEvento = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(eq(equipes.eventoId, eventoId))

      const equipeIds = equipesDoEvento.map((e) => e.id)
      if (equipeIds.length > 0) {
        await db
          .delete(equipeVoluntarios)
          .where(
            and(
              inArray(equipeVoluntarios.equipeId, equipeIds),
              eq(equipeVoluntarios.voluntarioId, voluntarioId)
            )
          )
      }

      await equipeService.adicionarMembro(dados.equipeId, voluntarioId, dados.funcaoId || undefined)
    }

    return this.buscarEnriquecido(voluntarioId, eventoId)
  }

  async atualizar(
    eventoId: string,
    id: string,
    dados: {
      nome?: string
      email?: string
      telefone?: string
      obs?: string
      tituloConvite?: string | null
      mensagemConvite?: string | null
      arteUrl?: string | null
      equipeId?: string | null
      funcaoId?: string | null
    }
  ) {
    // Atualizar dados gerais do voluntário
    await db
      .update(voluntarios)
      .set({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        obs: dados.obs,
        tituloConvite: dados.tituloConvite,
        mensagemConvite: dados.mensagemConvite,
        arteUrl: dados.arteUrl,
        atualizadoEm: new Date(),
      })
      .where(eq(voluntarios.id, id))

    // Gerenciar equipe e função no evento
    if (dados.equipeId !== undefined) {
      // Limpar associações com equipes deste evento
      const equipesDoEvento = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(eq(equipes.eventoId, eventoId))

      const equipeIds = equipesDoEvento.map((e) => e.id)
      if (equipeIds.length > 0) {
        await db
          .delete(equipeVoluntarios)
          .where(
            and(
              inArray(equipeVoluntarios.equipeId, equipeIds),
              eq(equipeVoluntarios.voluntarioId, id)
            )
          )
      }

      // Adicionar nova se equipeId for informado
      if (dados.equipeId) {
        await equipeService.adicionarMembro(
          dados.equipeId,
          id,
          dados.funcaoId || undefined
        )
      }
    } else if (dados.funcaoId !== undefined) {
      // Se apenas a função mudou, atualizar na tabela de equipeVoluntarios para a equipe desse evento
      const equipesDoEvento = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(eq(equipes.eventoId, eventoId))

      const equipeIds = equipesDoEvento.map((e) => e.id)
      if (equipeIds.length > 0) {
        await db
          .update(equipeVoluntarios)
          .set({ funcaoId: dados.funcaoId || null })
          .where(
            and(
              inArray(equipeVoluntarios.equipeId, equipeIds),
              eq(equipeVoluntarios.voluntarioId, id)
            )
          )
      }
    }

    return this.buscarEnriquecido(id, eventoId)
  }

  async remover(id: string) {
    await db.delete(equipeVoluntarios).where(eq(equipeVoluntarios.voluntarioId, id))
    await db.delete(voluntarios).where(eq(voluntarios.id, id))
  }
}

export const voluntarioService = new VoluntarioService()
