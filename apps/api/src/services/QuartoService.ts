import { eq, and, asc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { quartos, participantes } from '../db/schema/index.js'

export interface CriarQuartoPayload {
  nome: string
  genero?: 'masculino' | 'feminino' | 'misto'
  capacidade: number
  responsavelNome?: string
  localizacao?: string
  obs?: string
}

export class QuartoService {
  async listar(eventoId: string) {
    const lista = await db
      .select()
      .from(quartos)
      .where(eq(quartos.eventoId, eventoId))
      .orderBy(asc(quartos.nome))

    // Carrega participantes de cada quarto
    const participantesQuarto = await db
      .select({
        id: participantes.id,
        nome: participantes.nome,
        telefone: participantes.telefone,
        email: participantes.email,
        status: participantes.status,
        quartoId: participantes.quartoId,
        equipeId: participantes.equipeId,
        obs: participantes.obs,
        checkinEm: participantes.checkinEm,
      })
      .from(participantes)
      .where(and(eq(participantes.eventoId, eventoId), sql`${participantes.quartoId} IS NOT NULL`))

    const mapParticipantesPorQuarto = new Map<string, typeof participantesQuarto>()
    for (const p of participantesQuarto) {
      if (p.quartoId) {
        const list = mapParticipantesPorQuarto.get(p.quartoId) ?? []
        list.push(p)
        mapParticipantesPorQuarto.set(p.quartoId, list)
      }
    }

    return lista.map((q) => ({
      ...q,
      participantes: mapParticipantesPorQuarto.get(q.id) ?? [],
      ocupacao: (mapParticipantesPorQuarto.get(q.id) ?? []).length,
    }))
  }

  async buscarPorId(id: string) {
    const [q] = await db.select().from(quartos).where(eq(quartos.id, id)).limit(1)
    if (!q) return null

    const partes = await db
      .select()
      .from(participantes)
      .where(eq(participantes.quartoId, id))
      .orderBy(asc(participantes.nome))

    return {
      ...q,
      participantes: partes,
      ocupacao: partes.length,
    }
  }

  async criar(eventoId: string, dados: CriarQuartoPayload) {
    const [q] = await db
      .insert(quartos)
      .values({
        eventoId,
        nome: dados.nome,
        genero: dados.genero ?? 'misto',
        capacidade: dados.capacidade,
        responsavelNome: dados.responsavelNome,
        localizacao: dados.localizacao,
        obs: dados.obs,
      })
      .returning()
    return q
  }

  async atualizar(id: string, dados: Partial<CriarQuartoPayload>) {
    const [updated] = await db
      .update(quartos)
      .set({
        ...dados,
        atualizadoEm: new Date(),
      })
      .where(eq(quartos.id, id))
      .returning()
    return updated ?? null
  }

  async remover(id: string) {
    // Desvincula participantes do quarto antes de deletar
    await db
      .update(participantes)
      .set({ quartoId: null, atualizadoEm: new Date() })
      .where(eq(participantes.quartoId, id))

    const [deleted] = await db.delete(quartos).where(eq(quartos.id, id)).returning()
    return deleted ?? null
  }

  async alocarParticipante(participanteId: string, quartoId: string | null) {
    const [updated] = await db
      .update(participantes)
      .set({
        quartoId: quartoId ?? null,
        atualizadoEm: new Date(),
      })
      .where(eq(participantes.id, participanteId))
      .returning()
    return updated ?? null
  }
}

export const quartoService = new QuartoService()
