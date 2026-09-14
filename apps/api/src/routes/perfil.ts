import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { usuarios } from '../db/schema/index.js'
import { authenticate } from '../middlewares/authenticate.js'

const atualizarPerfilSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
})

const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z
    .string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Nova senha deve conter pelo menos um número'),
})

export async function perfilRoutes(app: FastifyInstance): Promise<void> {
  // Todas as rotas de perfil exigem autenticacao
  app.addHook('preHandler', authenticate)

  // GET /api/perfil - Retorna dados do usuario autenticado
  app.get('/', async (request, reply) => {
    const userId = request.user.id

    const [usuario] = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        criadoEm: usuarios.criadoEm,
        atualizadoEm: usuarios.atualizadoEm,
      })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    if (!usuario) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    return reply.status(200).send(usuario)
  })

  // PUT /api/perfil - Atualiza nome do usuario
  app.put('/', async (request, reply) => {
    const userId = request.user.id

    const result = atualizarPerfilSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        detalhes: result.error.flatten().fieldErrors,
      })
    }

    const { nome } = result.data

    const [usuarioAtualizado] = await db
      .update(usuarios)
      .set({
        nome,
        atualizadoEm: new Date(),
      })
      .where(eq(usuarios.id, userId))
      .returning({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        criadoEm: usuarios.criadoEm,
        atualizadoEm: usuarios.atualizadoEm,
      })

    if (!usuarioAtualizado) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    return reply.status(200).send(usuarioAtualizado)
  })

  // PUT /api/perfil/senha - Altera a senha do usuario
  app.put('/senha', async (request, reply) => {
    const userId = request.user.id

    const result = trocarSenhaSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        detalhes: result.error.flatten().fieldErrors,
      })
    }

    const { senhaAtual, novaSenha } = result.data

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    if (!usuario) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senhaHash)
    if (!senhaValida) {
      return reply.status(400).send({ error: 'Senha atual incorreta' })
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12)

    await db
      .update(usuarios)
      .set({
        senhaHash: novaSenhaHash,
        atualizadoEm: new Date(),
      })
      .where(eq(usuarios.id, userId))

    return reply.status(200).send({ ok: true, mensagem: 'Senha alterada com sucesso' })
  })
}
