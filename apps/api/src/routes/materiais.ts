import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { materialService } from '../services/MaterialService.js'

const uuidSchema = z.string().uuid()

const criarMaterialSchema = z.object({
  nome: z.string().min(1).max(200),
  quantidade: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  unidade: z.string().max(50).optional(),
  responsavelId: z.string().uuid().optional(),
  status: z.enum(['pendente', 'confirmado', 'entregue', 'cancelado']).optional(),
  obs: z.string().optional(),
})

const atualizarMaterialSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  quantidade: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  unidade: z.string().max(50).optional(),
  responsavelId: z.string().uuid().optional(),
  status: z.enum(['pendente', 'confirmado', 'entregue', 'cancelado']).optional(),
  obs: z.string().optional(),
})

const criarObservacaoSchema = z.object({
  conteudo: z.string().min(1),
})

const atualizarObservacaoSchema = z.object({
  conteudo: z.string().min(1),
})

const filtrosListarSchema = z.object({
  status: z.string().optional(),
  busca: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export async function materiaisRoutes(app: FastifyInstance): Promise<void> {
  // GET / — listar materiais
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
      const data = await materialService.listar(params.eventoId, result.data)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar materiais')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST / — criar material
  app.post(
    '/',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarMaterialSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const material = await materialService.criar(params.eventoId, result.data)
        return reply.status(201).send(material)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar material')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PUT /:id — atualizar material
  app.put(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarMaterialSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await materialService.atualizar(params.id, result.data)
        if (!updated) return reply.status(404).send({ error: 'Material nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar material')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /observacoes — listar observacoes
  app.get('/observacoes', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const data = await materialService.listarObservacoes(params.eventoId)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar observacoes')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /observacoes — criar observacao
  app.post('/observacoes', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const result = criarObservacaoSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
    }
    try {
      const obs = await materialService.criarObservacao(params.eventoId, request.user.id, result.data.conteudo)
      return reply.status(201).send(obs)
    } catch (err) {
      request.log.error({ err }, 'Erro ao criar observacao')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // PUT /observacoes/:id — atualizar observacao
  app.put('/observacoes/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    if (!uuidSchema.safeParse(params.id).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const result = atualizarObservacaoSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
    }
    try {
      const updated = await materialService.atualizarObservacao(params.id, result.data.conteudo)
      if (!updated) return reply.status(404).send({ error: 'Observacao nao encontrada' })
      return reply.status(200).send(updated)
    } catch (err) {
      request.log.error({ err }, 'Erro ao atualizar observacao')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })
}
