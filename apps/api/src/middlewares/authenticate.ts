import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Nao autorizado' })
    return
  }

  const token = authHeader.slice(7)
  const jwtSecret = process.env['JWT_SECRET']

  if (!jwtSecret) {
    request.log.error('JWT_SECRET nao definida')
    reply.status(401).send({ error: 'Nao autorizado' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload
    request.user = {
      id: payload['sub'] as string,
      nome: payload['nome'] as string,
      email: payload['email'] as string,
    }
  } catch {
    reply.status(401).send({ error: 'Nao autorizado' })
  }
}
