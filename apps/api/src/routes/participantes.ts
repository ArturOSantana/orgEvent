import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { participanteService } from '../services/ParticipanteService.js'

const uuidSchema = z.string().uuid()

const criarParticipanteSchema = z.object({
  nome: z.string().min(1).max(200),
  email: z.string().email().optional(),
  telefone: z.string().max(20).optional(),
  obs: z.string().optional(),
  status: z.enum(['confirmado', 'pendente', 'cancelado']).optional(),
  equipeId: z.string().uuid().optional(),
  quartoId: z.string().uuid().optional(),
})

const atualizarParticipanteSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().max(20).optional().nullable(),
  obs: z.string().optional().nullable(),
  status: z.enum(['confirmado', 'pendente', 'cancelado']).optional(),
  equipeId: z.string().uuid().optional().nullable(),
  quartoId: z.string().uuid().optional().nullable(),
})

const alocarEquipeSchema = z.object({
  equipeId: z.string().uuid().nullable(),
})

const alocarQuartoSchema = z.object({
  quartoId: z.string().uuid().nullable(),
})

const importarCsvSchema = z.object({
  participantes: z.array(
    z.object({
      nome: z.string().min(1).max(200),
      email: z.string().email().optional(),
      telefone: z.string().max(20).optional(),
    }),
  ).min(1).max(500),
})

const filtrosListarSchema = z.object({
  busca: z.string().optional(),
  equipeId: z.string().uuid().optional(),
  quartoId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export async function participantesRoutes(app: FastifyInstance): Promise<void> {
  // GET / — listar participantes
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const result = filtrosListarSchema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'Parametros invalidos' })
    }
    try {
      const data = await participanteService.listar(params.eventoId, result.data)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar participantes')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /importar — importar CSV (antes de POST / para evitar ambiguidade)
  app.post(
    '/importar',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = importarCsvSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const criados = await participanteService.importarCsv(params.eventoId, result.data.participantes)
        return reply.status(201).send({ total: criados.length, data: criados })
      } catch (err) {
        request.log.error({ err }, 'Erro ao importar participantes')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST / — criar participante
  app.post(
    '/',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarParticipanteSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const p = await participanteService.criar(params.eventoId, result.data)
        return reply.status(201).send(p)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar participante')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /:id — buscar participante
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    if (!uuidSchema.safeParse(params.id).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const p = await participanteService.buscarPorId(params.id)
      if (!p) return reply.status(404).send({ error: 'Participante nao encontrado' })
      return reply.status(200).send(p)
    } catch (err) {
      request.log.error({ err }, 'Erro ao buscar participante')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // PUT /:id — atualizar participante
  app.put(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarParticipanteSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await participanteService.atualizar(params.id, result.data)
        if (!updated) return reply.status(404).send({ error: 'Participante nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar participante')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // DELETE /:id — excluir participante
  app.delete(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const deleted = await participanteService.remover(params.id)
        if (!deleted) return reply.status(404).send({ error: 'Participante nao encontrado' })
        return reply.status(200).send({ ok: true })
      } catch (err) {
        request.log.error({ err }, 'Erro ao remover participante')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:id/equipe — alocar em equipe
  app.post(
    '/:id/equipe',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = alocarEquipeSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await participanteService.alocarEquipe(params.id, result.data.equipeId)
        if (!updated) return reply.status(404).send({ error: 'Participante nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao alocar participante em equipe')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:id/quarto — alocar em quarto
  app.post(
    '/:id/quarto',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = alocarQuartoSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await participanteService.alocarQuarto(params.id, result.data.quartoId)
        if (!updated) return reply.status(404).send({ error: 'Participante nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao alocar participante em quarto')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:id/checkin — registrar check-in
  app.post(
    '/:id/checkin',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await participanteService.registrarCheckin(params.id)
        if (!updated) return reply.status(404).send({ error: 'Participante nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao registrar checkin')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}
