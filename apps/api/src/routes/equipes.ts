import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { equipeService } from '../services/EquipeService.js'

const uuidSchema = z.string().uuid()

const criarEquipeSchema = z.object({
  nome: z.string().min(1).max(200),
  descricao: z.string().optional(),
})

const atualizarEquipeSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  descricao: z.string().optional(),
})

const adicionarMembroSchema = z.object({
  voluntarioId: z.string().uuid(),
  funcaoId: z.string().uuid().optional(),
})

const criarFuncaoSchema = z.object({
  nome: z.string().min(1).max(200),
  descricao: z.string().optional(),
})

export async function equipesRoutes(app: FastifyInstance): Promise<void> {
  // GET / — listar equipes
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const data = await equipeService.listar(params.eventoId)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar equipes')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST / — criar equipe
  app.post(
    '/',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarEquipeSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const equipe = await equipeService.criar(params.eventoId, result.data)
        return reply.status(201).send(equipe)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar equipe')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /funcoes — listar funcoes (antes do /:equipeId para nao ser capturado)
  app.get('/funcoes', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const data = await equipeService.listarFuncoes(params.eventoId)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar funcoes')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /funcoes — criar funcao
  app.post(
    '/funcoes',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarFuncaoSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const funcao = await equipeService.criarFuncao(params.eventoId, result.data)
        return reply.status(201).send(funcao)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar funcao')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /:equipeId — buscar equipe
  app.get('/:equipeId', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string; equipeId: string }
    if (!uuidSchema.safeParse(params.equipeId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const equipe = await equipeService.buscarPorId(params.equipeId)
      if (!equipe) return reply.status(404).send({ error: 'Equipe nao encontrada' })
      return reply.status(200).send(equipe)
    } catch (err) {
      request.log.error({ err }, 'Erro ao buscar equipe')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // PUT /:equipeId — atualizar equipe
  app.put(
    '/:equipeId',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; equipeId: string }
      if (!uuidSchema.safeParse(params.equipeId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarEquipeSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await equipeService.atualizar(params.equipeId, result.data)
        if (!updated) return reply.status(404).send({ error: 'Equipe nao encontrada' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar equipe')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:equipeId/membros — adicionar membro
  app.post(
    '/:equipeId/membros',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; equipeId: string }
      if (!uuidSchema.safeParse(params.equipeId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = adicionarMembroSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const row = await equipeService.adicionarMembro(params.equipeId, result.data.voluntarioId, result.data.funcaoId)
        return reply.status(200).send(row)
      } catch (err) {
        request.log.error({ err }, 'Erro ao adicionar membro')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // DELETE /:equipeId/membros/:voluntarioId — remover membro
  app.delete(
    '/:equipeId/membros/:voluntarioId',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; equipeId: string; voluntarioId: string }
      if (!uuidSchema.safeParse(params.equipeId).success || !uuidSchema.safeParse(params.voluntarioId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        await equipeService.removerMembro(params.equipeId, params.voluntarioId)
        return reply.status(204).send()
      } catch (err) {
        request.log.error({ err }, 'Erro ao remover membro')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}
