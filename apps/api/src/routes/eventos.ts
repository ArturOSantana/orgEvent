import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { eventoService } from '../services/EventoService.js'

const uuidSchema = z.string().uuid()

const criarEventoSchema = z.object({
  nome: z.string().min(1).max(300),
  tipo: z.string().min(1).max(100),
  descricao: z.string().optional(),
  dataInicio: z.string().datetime(),
  dataFim: z.string().datetime(),
  local: z.string().max(300).optional(),
  capacidade: z.number().int().positive().optional(),
  obs: z.string().optional(),
})

const atualizarEventoSchema = z.object({
  nome: z.string().min(1).max(300).optional(),
  tipo: z.string().min(1).max(100).optional(),
  descricao: z.string().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  local: z.string().max(300).optional(),
  capacidade: z.number().int().positive().optional(),
  status: z.string().max(50).optional(),
  obs: z.string().optional(),
})

const adicionarUsuarioSchema = z.object({
  email: z.string().email(),
  perfil: z.enum(['coordenador', 'lider', 'voluntario']),
})

const filtrosListarSchema = z.object({
  status: z.string().optional(),
  busca: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export async function eventosRoutes(app: FastifyInstance): Promise<void> {
  // GET / — listar eventos do usuario autenticado
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = filtrosListarSchema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'Parametros invalidos' })
    }
    try {
      const data = await eventoService.listar(request.user.id, result.data)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar eventos')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST / — criar evento
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = criarEventoSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
    }
    try {
      const { dataInicio, dataFim, ...rest } = result.data
      const evento = await eventoService.criar(
        { ...rest, dataInicio: new Date(dataInicio), dataFim: new Date(dataFim) },
        request.user.id,
      )
      return reply.status(201).send(evento)
    } catch (err) {
      request.log.error({ err }, 'Erro ao criar evento')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // GET /:eventoId — buscar evento
  app.get('/:eventoId', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const evento = await eventoService.buscarPorId(params.eventoId, request.user.id)
      if (!evento) return reply.status(404).send({ error: 'Evento nao encontrado' })
      return reply.status(200).send(evento)
    } catch (err) {
      request.log.error({ err }, 'Erro ao buscar evento')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // PUT /:eventoId — atualizar evento (coordenador)
  app.put(
    '/:eventoId',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarEventoSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const { dataInicio, dataFim, ...rest } = result.data
        const dados: Record<string, unknown> = { ...rest }
        if (dataInicio) dados['dataInicio'] = new Date(dataInicio)
        if (dataFim) dados['dataFim'] = new Date(dataFim)
        const updated = await eventoService.atualizar(params.eventoId, dados as Parameters<typeof eventoService.atualizar>[1])
        if (!updated) return reply.status(404).send({ error: 'Evento nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar evento')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:eventoId/arquivar — arquivar evento (coordenador)
  app.post(
    '/:eventoId/arquivar',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await eventoService.arquivar(params.eventoId)
        if (!updated) return reply.status(404).send({ error: 'Evento nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao arquivar evento')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:eventoId/desarquivar — desarquivar evento (coordenador)
  app.post(
    '/:eventoId/desarquivar',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await eventoService.desarquivar(params.eventoId)
        if (!updated) return reply.status(404).send({ error: 'Evento nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao desarquivar evento')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // DELETE /:eventoId — apagar evento e todos os dados (coordenador)
  app.delete(
    '/:eventoId',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        await eventoService.apagar(params.eventoId)
        return reply.status(204).send()
      } catch (err) {
        request.log.error({ err }, 'Erro ao apagar evento')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /:eventoId/usuarios — adicionar usuario ao evento (coordenador)
  app.post(
    '/:eventoId/usuarios',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = adicionarUsuarioSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const vinculo = await eventoService.adicionarUsuario(params.eventoId, result.data.email, result.data.perfil)
        return reply.status(200).send(vinculo)
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'USUARIO_NAO_ENCONTRADO') {
          return reply.status(404).send({ error: 'Usuario nao encontrado' })
        }
        request.log.error({ err }, 'Erro ao adicionar usuario ao evento')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}
