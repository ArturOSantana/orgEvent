import { eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { equipes, equipeVoluntarios, funcoes, voluntarios } from '../db/schema/index.js'

export class EquipeService {
  async listar(eventoId: string) {
    const rows = await db
      .select({
        id: equipes.id,
        eventoId: equipes.eventoId,
        nome: equipes.nome,
        descricao: equipes.descricao,
        criadoEm: equipes.criadoEm,
        atualizadoEm: equipes.atualizadoEm,
        totalMembros: sql<number>`count(${equipeVoluntarios.id})::int`,
      })
      .from(equipes)
      .leftJoin(equipeVoluntarios, eq(equipeVoluntarios.equipeId, equipes.id))
      .where(eq(equipes.eventoId, eventoId))
      .groupBy(equipes.id)

    return rows
  }

  async buscarPorId(id: string) {
    const [equipe] = await db.select().from(equipes).where(eq(equipes.id, id)).limit(1)
    if (!equipe) return null

    const membros = await db
      .select({
        id: equipeVoluntarios.id,
        voluntarioId: equipeVoluntarios.voluntarioId,
        funcaoId: equipeVoluntarios.funcaoId,
        voluntarioNome: voluntarios.nome,
        voluntarioEmail: voluntarios.email,
        voluntarioTelefone: voluntarios.telefone,
        funcaoNome: funcoes.nome,
      })
      .from(equipeVoluntarios)
      .leftJoin(voluntarios, eq(voluntarios.id, equipeVoluntarios.voluntarioId))
      .leftJoin(funcoes, eq(funcoes.id, equipeVoluntarios.funcaoId))
      .where(eq(equipeVoluntarios.equipeId, id))

    return { ...equipe, membros }
  }

  async criar(eventoId: string, dados: { nome: string; descricao?: string }) {
    const [equipe] = await db
      .insert(equipes)
      .values({ eventoId, nome: dados.nome, descricao: dados.descricao })
      .returning()
    return equipe
  }

  async atualizar(id: string, dados: Partial<{ nome: string; descricao: string }>) {
    const [updated] = await db
      .update(equipes)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(equipes.id, id))
      .returning()
    return updated ?? null
  }

  async deletar(id: string) {
    await db.delete(equipeVoluntarios).where(eq(equipeVoluntarios.equipeId, id))
    const [deleted] = await db.delete(equipes).where(eq(equipes.id, id)).returning()
    return deleted ?? null
  }

  async adicionarMembro(equipeId: string, voluntarioId: string, funcaoId?: string) {
    const [row] = await db
      .insert(equipeVoluntarios)
      .values({ equipeId, voluntarioId, funcaoId: funcaoId ?? null })
      .onConflictDoNothing()
      .returning()
    return row
  }

  async removerMembro(membroId: string) {
    await db
      .delete(equipeVoluntarios)
      .where(eq(equipeVoluntarios.id, membroId))
  }

  async listarFuncoes(eventoId: string) {
    return db.select().from(funcoes).where(eq(funcoes.eventoId, eventoId))
  }

  async criarFuncao(eventoId: string, dados: { nome: string; descricao?: string }) {
    const [funcao] = await db
      .insert(funcoes)
      .values({ eventoId, nome: dados.nome, descricao: dados.descricao })
      .returning()
    return funcao
  }
}

export const equipeService = new EquipeService()
