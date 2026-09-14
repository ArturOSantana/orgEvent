import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { voluntarioService } from '../services/VoluntarioService.js'
import { conviteService } from '../services/ConviteService.js'

const uuidSchema = z.string().uuid()

const criarVoluntarioSchema = z.object({
  nome: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().max(20).optional(),
  obs: z.string().optional(),
  tituloConvite: z.string().max(500).optional().nullable(),
  mensagemConvite: z.string().max(2000).optional().nullable(),
  arteUrl: z.string().max(1000).optional().nullable(),
  equipeId: z.string().uuid().optional().nullable(),
  funcaoId: z.string().uuid().optional().nullable(),
})

const atualizarVoluntarioSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().max(20).optional(),
  obs: z.string().optional(),
  tituloConvite: z.string().max(500).optional().nullable(),
  mensagemConvite: z.string().max(2000).optional().nullable(),
  arteUrl: z.string().max(1000).optional().nullable(),
  equipeId: z.string().uuid().optional().nullable(),
  funcaoId: z.string().uuid().optional().nullable(),
})

const filtrosListarSchema = z.object({
  busca: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export async function voluntariosRoutes(app: FastifyInstance): Promise<void> {
  // GET / — listar voluntarios do evento com dados de convite
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
      const data = await conviteService.listarComConvite(params.eventoId)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar voluntarios')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST / — buscar ou criar voluntario
  app.post(
    '/',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID de evento invalido' })
      }
      const result = criarVoluntarioSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const voluntario = await voluntarioService.buscarOuCriar(params.eventoId, result.data)
        return reply.status(200).send(voluntario)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar voluntario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PUT /:id — atualizar voluntario
  app.put(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string; eventoId: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID de evento invalido' })
      }
      const result = atualizarVoluntarioSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await voluntarioService.atualizar(params.eventoId, params.id, result.data)
        if (!updated) return reply.status(404).send({ error: 'Voluntario nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar voluntario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:id/convite — gerar convite para voluntário (admin)
  app.post(
    '/:id/convite',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const resultado = await conviteService.gerarConvite(params.id)
        return reply.status(200).send(resultado)
      } catch (err) {
        request.log.error({ err }, 'Erro ao gerar convite')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // DELETE /:id/convite — remover voluntario (mantém compatibilidade e remove slug)
  app.delete(
    '/:id',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { id: string }
      if (!uuidSchema.safeParse(params.id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        await voluntarioService.remover(params.id)
        return reply.status(204).send()
      } catch (err) {
        request.log.error({ err }, 'Erro ao remover voluntario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}
