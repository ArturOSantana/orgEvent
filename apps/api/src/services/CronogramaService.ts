import { eq, and, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { fases, horarios } from '../db/schema/index.js'

export class CronogramaService {
  // ——— Fases ———

  async listarFases(eventoId: string) {
    return db.select().from(fases).where(eq(fases.eventoId, eventoId)).orderBy(asc(fases.ordem))
  }

  async criarFase(eventoId: string, dados: { nome: string; descricao?: string; ordem?: number }) {
    const [fase] = await db
      .insert(fases)
      .values({ eventoId, nome: dados.nome, descricao: dados.descricao, ordem: dados.ordem ?? 0 })
      .returning()
    return fase
  }

  async atualizarFase(id: string, dados: Partial<{ nome: string; descricao: string; ordem: number }>) {
    const [updated] = await db
      .update(fases)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(fases.id, id))
      .returning()
    return updated ?? null
  }

  // ——— Horarios ———

  async listarHorarios(eventoId: string, faseId?: string) {
    const conditions = [eq(horarios.eventoId, eventoId)]
    if (faseId) {
      conditions.push(eq(horarios.faseId, faseId))
    }
    return db
      .select()
      .from(horarios)
      .where(and(...conditions))
      .orderBy(asc(horarios.data), asc(horarios.horaInicio))
  }

  async criarHorario(
    eventoId: string,
    dados: {
      titulo: string
      descricao?: string
      data: string
      horaInicio: string
      horaFim: string
      local?: string
      faseId?: string
      responsavelId?: string
      ordem?: number
    },
  ) {
    const [horario] = await db
      .insert(horarios)
      .values({ eventoId, ...dados, ordem: dados.ordem ?? 0 })
      .returning()
    return horario
  }

  async atualizarHorario(
    id: string,
    dados: Partial<{
      titulo: string
      descricao: string
      data: string
      horaInicio: string
      horaFim: string
      local: string
      faseId: string
      responsavelId: string
      ordem: number
    }>,
  ) {
    const [updated] = await db
      .update(horarios)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(horarios.id, id))
      .returning()
    return updated ?? null
  }

  async removerHorario(id: string) {
    await db.delete(horarios).where(eq(horarios.id, id))
  }
}

export const cronogramaService = new CronogramaService()
