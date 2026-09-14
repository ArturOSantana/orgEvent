import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authService } from '../services/AuthService.js'
import { authenticate } from '../middlewares/authenticate.js'

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /login — limite restrito: 10 requisicoes por minuto por IP
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const result = loginSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invalidos' })
    }

    const { email, senha } = result.data

    try {
      const data = await authService.login(email, senha)
      return reply.status(200).send(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'CREDENCIAIS_INVALIDAS') {
        return reply.status(401).send({ error: 'Credenciais invalidas' })
      }
      // Erro inesperado — log server-side, resposta generica ao cliente
      request.log.error({ err }, 'Erro interno em /auth/login')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /refresh — limite restrito: 10 requisicoes por minuto por IP
  app.post('/refresh', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const result = refreshSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invalidos' })
    }

    const { refreshToken } = result.data

    try {
      const data = await authService.refresh(refreshToken)
      return reply.status(200).send(data)
    } catch {
      return reply.status(401).send({ error: 'Token invalido ou expirado' })
    }
  })

  // POST /logout (requer autenticacao)
  app.post(
    '/logout',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const result = logoutSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos' })
      }

      const { refreshToken } = result.data

      await authService.logout(refreshToken)
      return reply.status(200).send({ ok: true })
    },
  )
}
