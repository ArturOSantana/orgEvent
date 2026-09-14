import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { quartoService } from '../services/QuartoService.js'

const uuidSchema = z.string().uuid()

const criarQuartoSchema = z.object({
  nome: z.string().min(1).max(200),
  genero: z.enum(['masculino', 'feminino', 'misto']).optional(),
  capacidade: z.number().int().min(1).max(200),
  responsavelNome: z.string().max(200).optional(),
  localizacao: z.string().max(200).optional(),
  obs: z.string().optional(),
})

const atualizarQuartoSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  genero: z.enum(['masculino', 'feminino', 'misto']).optional(),
  capacidade: z.number().int().min(1).max(200).optional(),
  responsavelNome: z.string().max(200).optional().nullable(),
  localizacao: z.string().max(200).optional().nullable(),
  obs: z.string().optional().nullable(),
})

const alocarParticipanteSchema = z.object({
  participanteId: z.string().uuid(),
  quartoId: z.string().uuid().nullable(),
})

export async function quartosRoutes(app: FastifyInstance): Promise<void> {
  // GET / — listar quartos do evento
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const lista = await quartoService.listar(params.eventoId)
      return reply.status(200).send(lista)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar quartos')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST / — criar quarto
  app.post(
    '/',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarQuartoSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const q = await quartoService.criar(params.eventoId, result.data)
        return reply.status(201).send(q)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar quarto')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /:id — detalhe do quarto
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    if (!uuidSchema.safeParse(params.id).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const q = await quartoService.buscarPorId(params.id)
      if (!q) return reply.status(404).send({ error: 'Quarto nao encontrado' })
      return reply.status(200).send(q)
    } catch (err) {
      request.log.error({ err }, 'Erro ao buscar quarto')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // PUT /:id — atualizar quarto
  app.put(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarQuartoSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const q = await quartoService.atualizar(params.id, result.data as any)
        if (!q) return reply.status(404).send({ error: 'Quarto nao encontrado' })
        return reply.status(200).send(q)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar quarto')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // DELETE /:id — remover quarto
  app.delete(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const q = await quartoService.remover(params.id)
        if (!q) return reply.status(404).send({ error: 'Quarto nao encontrado' })
        return reply.status(200).send({ ok: true })
      } catch (err) {
        request.log.error({ err }, 'Erro ao remover quarto')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /alocar — alocar/desalocar participante em quarto
  app.post(
    '/alocar',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const result = alocarParticipanteSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await quartoService.alocarParticipante(
          result.data.participanteId,
          result.data.quartoId,
        )
        if (!updated) return reply.status(404).send({ error: 'Participante nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao alocar participante no quarto')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}
