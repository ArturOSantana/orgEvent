import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { conviteService } from '../services/ConviteService.js'

const responderSchema = z.object({
  status: z.enum(['aceito', 'recusado']),
  observacao: z.string().max(1000).optional().default(''),
})

export async function convitesPublicosRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/convites/:slug — dados públicos do convite (sem autenticação)
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }

    if (!slug || slug.length > 300) {
      return reply.status(400).send({ error: 'Slug invalido' })
    }

    const convite = await conviteService.buscarPorSlug(slug)
    if (!convite) {
      return reply.status(404).send({ error: 'Convite nao encontrado' })
    }

    // Registra visualização de forma assíncrona — não bloqueia a resposta
    conviteService.marcarVisualizacao(slug).catch(() => {
      // Silencia erros de registro de visualização
    })

    return reply.status(200).send(convite)
  })

  // POST /api/convites/:slug/responder — voluntário responde (sem autenticação)
  app.post('/:slug/responder', async (request, reply) => {
    const { slug } = request.params as { slug: string }

    if (!slug || slug.length > 300) {
      return reply.status(400).send({ error: 'Slug invalido' })
    }

    const result = responderSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
    }

    const convite = await conviteService.buscarPorSlug(slug)
    if (!convite) {
      return reply.status(404).send({ error: 'Convite nao encontrado' })
    }

    const atualizado = await conviteService.registrarResposta(
      slug,
      result.data.status,
      result.data.observacao,
    )

    return reply.status(200).send({ success: true, convite: atualizado })
  })
}
