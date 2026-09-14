import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { authenticate } from '../middlewares/authenticate.js'
import { db } from '../db/index.js'
import { eventoUsuarios } from '../db/schema/index.js'
import { gerarCronogramaPDF } from '../export/CronogramaPDF.js'
import { gerarEscalasPDF } from '../export/EscalasPDF.js'
import { gerarParticipantesXLSX } from '../export/ParticipantesXLSX.js'
import { gerarMateriaisXLSX } from '../export/MateriaisXLSX.js'
import { gerarInscricoesXLSX } from '../export/InscricoesXLSX.js'
import { gerarVoluntariosXLSX } from '../export/VoluntariosXLSX.js'
import { gerarVoluntariosPDF } from '../export/VoluntariosPDF.js'

const uuidSchema = z.string().uuid()

const MIME_PDF = 'application/pdf'
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function verificarAcessoEvento(usuarioId: string, eventoId: string): Promise<boolean> {
  const [vinculo] = await db
    .select()
    .from(eventoUsuarios)
    .where(
      eq(eventoUsuarios.eventoId, eventoId),
    )
    .limit(100)
    .then((rows) => rows.filter((r) => r.usuarioId === usuarioId))

  return vinculo !== undefined
}

export async function exportarRoutes(app: FastifyInstance): Promise<void> {
  // GET /cronograma.pdf
  app.get('/cronograma.pdf', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarCronogramaPDF(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_PDF)
        .header('Content-Disposition', 'attachment; filename="cronograma.pdf"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar cronograma.pdf')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })

  // GET /escalas.pdf
  app.get('/escalas.pdf', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarEscalasPDF(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_PDF)
        .header('Content-Disposition', 'attachment; filename="escalas.pdf"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar escalas.pdf')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })

  // GET /participantes.xlsx
  app.get('/participantes.xlsx', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarParticipantesXLSX(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_XLSX)
        .header('Content-Disposition', 'attachment; filename="participantes.xlsx"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar participantes.xlsx')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })

  // GET /inscricoes.xlsx
  app.get('/inscricoes.xlsx', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarInscricoesXLSX(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_XLSX)
        .header('Content-Disposition', 'attachment; filename="inscricoes.xlsx"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar inscricoes.xlsx')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })

  // GET /materiais.xlsx
  app.get('/materiais.xlsx', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarMateriaisXLSX(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_XLSX)
        .header('Content-Disposition', 'attachment; filename="materiais.xlsx"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar materiais.xlsx')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })

  // GET /voluntarios.xlsx
  app.get('/voluntarios.xlsx', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarVoluntariosXLSX(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_XLSX)
        .header('Content-Disposition', 'attachment; filename="voluntarios.xlsx"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar voluntarios.xlsx')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })

  // GET /voluntarios.pdf
  app.get('/voluntarios.pdf', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const temAcesso = await verificarAcessoEvento(request.user.id, params.eventoId)
    if (!temAcesso) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    try {
      const buffer = await gerarVoluntariosPDF(params.eventoId, db)
      return reply
        .header('Content-Type', MIME_PDF)
        .header('Content-Disposition', 'attachment; filename="voluntarios.pdf"')
        .send(buffer)
    } catch (err) {
      request.log.error({ err }, 'Erro ao gerar voluntarios.pdf')
      return reply.status(500).send({ error: 'Erro ao gerar arquivo' })
    }
  })
}
