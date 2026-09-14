import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { eventoUsuarios } from '../db/schema/index.js'

export function authorize(
  perfisPermitidos: string[],
  eventoIdParam = 'eventoId',
) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const params = request.params as Record<string, string>
    const eventoId = params[eventoIdParam]

    if (!eventoId) {
      reply.status(403).send({ error: 'Sem permissao' })
      return
    }

    const usuarioId = request.user.id

    const [vinculo] = await db
      .select()
      .from(eventoUsuarios)
      .where(
        and(
          eq(eventoUsuarios.usuarioId, usuarioId),
          eq(eventoUsuarios.eventoId, eventoId),
        ),
      )
      .limit(1)

    if (!vinculo || !perfisPermitidos.includes(vinculo.perfil)) {
      reply.status(403).send({ error: 'Sem permissao' })
      return
    }
  }
}
