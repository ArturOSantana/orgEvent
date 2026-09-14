import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { syncService } from '../services/SyncService.js'

const operacaoSyncSchema = z.object({
  clienteId: z.string().uuid(),
  entidade: z.string().min(1).max(100),
  operacao: z.string().min(1).max(50),
  payload: z.record(z.string(), z.unknown()),
  clienteTimestamp: z.string().datetime(),
})

const syncRequestSchema = z.object({
  operacoes: z.array(operacaoSyncSchema).min(1).max(500),
})

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/sync — sincroniza operacoes offline
  app.post('/sync', { preHandler: [authenticate] }, async (request, reply) => {
    const result = syncRequestSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Dados invalidos',
        detalhes: result.error.flatten().fieldErrors,
      })
    }

    try {
      const resposta = await syncService.processar(request.user.id, result.data.operacoes)
      // Sempre retorna 200 — conflitos e erros sao parte da resposta normal
      return reply.status(200).send(resposta)
    } catch (err) {
      request.log.error({ err }, 'Erro ao processar sincronizacao')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })
}
