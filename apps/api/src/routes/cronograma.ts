import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { cronogramaService } from '../services/CronogramaService.js'

const uuidSchema = z.string().uuid()

const criarFaseSchema = z.object({
  nome: z.string().min(1).max(200),
  descricao: z.string().optional(),
  ordem: z.number().int().optional(),
})

const atualizarFaseSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  descricao: z.string().optional(),
  ordem: z.number().int().optional(),
})

const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const criarHorarioSchema = z.object({
  titulo: z.string().min(1).max(300),
  descricao: z.string().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  horaInicio: z.string().regex(horaRegex, 'Hora deve estar no formato HH:MM'),
  horaFim: z.string().regex(horaRegex, 'Hora deve estar no formato HH:MM'),
  local: z.string().max(200).optional(),
  faseId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  ordem: z.number().int().optional(),
})

const atualizarHorarioSchema = criarHorarioSchema.partial()

export async function cronogramaRoutes(app: FastifyInstance): Promise<void> {
  // GET /fases
  app.get('/fases', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    try {
      const data = await cronogramaService.listarFases(params.eventoId)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar fases')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /fases
  app.post(
    '/fases',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarFaseSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const fase = await cronogramaService.criarFase(params.eventoId, result.data)
        return reply.status(201).send(fase)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar fase')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PUT /fases/:faseId
  app.put(
    '/fases/:faseId',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; faseId: string }
      if (!uuidSchema.safeParse(params.faseId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarFaseSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await cronogramaService.atualizarFase(params.faseId, result.data)
        if (!updated) return reply.status(404).send({ error: 'Fase nao encontrada' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar fase')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /horarios
  app.get('/horarios', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { eventoId: string }
    if (!uuidSchema.safeParse(params.eventoId).success) {
      return reply.status(400).send({ error: 'ID invalido' })
    }
    const query = request.query as { faseId?: string }
    if (query.faseId && !uuidSchema.safeParse(query.faseId).success) {
      return reply.status(400).send({ error: 'faseId invalido' })
    }
    try {
      const data = await cronogramaService.listarHorarios(params.eventoId, query.faseId)
      return reply.status(200).send(data)
    } catch (err) {
      request.log.error({ err }, 'Erro ao listar horarios')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /horarios
  app.post(
    '/horarios',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(params.eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = criarHorarioSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const horario = await cronogramaService.criarHorario(params.eventoId, result.data)
        return reply.status(201).send(horario)
      } catch (err) {
        request.log.error({ err }, 'Erro ao criar horario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PUT /horarios/:horarioId
  app.put(
    '/horarios/:horarioId',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; horarioId: string }
      if (!uuidSchema.safeParse(params.horarioId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = atualizarHorarioSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const updated = await cronogramaService.atualizarHorario(params.horarioId, result.data)
        if (!updated) return reply.status(404).send({ error: 'Horario nao encontrado' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar horario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // DELETE /horarios/:horarioId
  app.delete(
    '/horarios/:horarioId',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const params = request.params as { eventoId: string; horarioId: string }
      if (!uuidSchema.safeParse(params.horarioId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        await cronogramaService.removerHorario(params.horarioId)
        return reply.status(204).send()
      } catch (err) {
        request.log.error({ err }, 'Erro ao remover horario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}
