import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { inscricaoService } from '../services/InscricaoService.js'

const uuidSchema = z.string().uuid()

// ── Schemas de validação ──────────────────────────────────────────────────────

const campoSchema = z.object({
  id: z.string().uuid().optional(),
  rotulo: z.string().min(1).max(200),
  tipo: z.enum(['texto', 'textarea', 'select', 'checkbox']),
  opcoes: z.array(z.string().min(1).max(200)).optional(),
  obrigatorio: z.boolean(),
  ordem: z.number().int().min(0),
})

const formularioSchema = z.object({
  titulo: z.string().min(1).max(300),
  descricao: z.string().optional(),
  coletarTelefone: z.boolean().optional(),
  coletarEmail: z.boolean().optional(),
  valorInscricao: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  instrucoesPagamento: z.string().optional(),
  ativo: z.boolean().optional(),
  dataLimite: z.string().datetime().optional().nullable(),
  vagas: z.number().int().positive().optional().nullable(),
  campos: z.array(campoSchema).optional(),
})

const inscricaoPublicaSchema = z.object({
  nome: z.string().min(1).max(200),
  email: z.string().email().optional(),
  telefone: z.string().max(20).optional(),
  respostas: z
    .array(
      z.object({
        campoId: z.string().uuid(),
        valor: z.string().max(2000),
      }),
    )
    .optional(),
})

const filtrosSchema = z.object({
  status: z.string().optional(),
  busca: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

const obsAdminSchema = z.object({
  obs: z.string().max(2000),
})

// ── Rotas admin (requerem autenticação) ───────────────────────────────────────
// IMPORTANTE: paths são absolutos porque o Fastify v5 não propaga params de
// route do prefix dinâmico para handlers registrados via app.register(plugin, {prefix}).

export async function formularioRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/eventos/:eventoId/formulario — obtém formulário do evento
  app.get(
    '/api/eventos/:eventoId/formulario',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { eventoId } = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const form = await inscricaoService.obterFormularioPorEvento(eventoId)
        return reply.status(200).send(form ?? null)
      } catch (err) {
        request.log.error({ err }, 'Erro ao obter formulario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PUT /api/eventos/:eventoId/formulario — criar ou atualizar formulário
  app.put(
    '/api/eventos/:eventoId/formulario',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const { eventoId } = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = formularioSchema.safeParse(request.body)
      if (!result.success) {
        return reply
          .status(400)
          .send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
      }
      try {
        const { dataLimite, ...rest } = result.data
        const form = await inscricaoService.criarOuAtualizarFormulario(eventoId, {
          ...rest,
          dataLimite: dataLimite ? new Date(dataLimite) : null,
        })
        return reply.status(200).send(form)
      } catch (err) {
        request.log.error({ err }, 'Erro ao salvar formulario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PATCH /api/eventos/:eventoId/formulario/ativo — ativar/desativar
  app.patch(
    '/api/eventos/:eventoId/formulario/ativo',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const { eventoId } = request.params as { eventoId: string }
      const result = z.object({ ativo: z.boolean() }).safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos' })
      }
      try {
        await inscricaoService.alternarAtivo(eventoId, result.data.ativo)
        return reply.status(200).send({ ok: true })
      } catch (err) {
        request.log.error({ err }, 'Erro ao alterar status formulario')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /api/eventos/:eventoId/formulario/inscricoes — listar inscrições
  app.get(
    '/api/eventos/:eventoId/formulario/inscricoes',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { eventoId } = request.params as { eventoId: string }
      if (!uuidSchema.safeParse(eventoId).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      const result = filtrosSchema.safeParse(request.query)
      if (!result.success) {
        return reply.status(400).send({ error: 'Parametros invalidos' })
      }
      try {
        const data = await inscricaoService.listarInscricoes(eventoId, result.data)
        return reply.status(200).send(data)
      } catch (err) {
        request.log.error({ err }, 'Erro ao listar inscricoes')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // GET /api/eventos/:eventoId/formulario/inscricoes/:id — detalhe
  app.get(
    '/api/eventos/:eventoId/formulario/inscricoes/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { eventoId: string; id: string }
      if (!uuidSchema.safeParse(id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const insc = await inscricaoService.buscarInscricaoPorId(id)
        if (!insc) return reply.status(404).send({ error: 'Inscricao nao encontrada' })
        return reply.status(200).send(insc)
      } catch (err) {
        request.log.error({ err }, 'Erro ao buscar inscricao')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /api/eventos/:eventoId/formulario/inscricoes/:id/confirmar-pagamento
  app.post(
    '/api/eventos/:eventoId/formulario/inscricoes/:id/confirmar-pagamento',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const { id } = request.params as { eventoId: string; id: string }
      if (!uuidSchema.safeParse(id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await inscricaoService.confirmarPagamento(id, request.user.id)
        if (!updated)
          return reply
            .status(404)
            .send({ error: 'Inscricao nao encontrada ou status incompativel' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao confirmar pagamento')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /api/eventos/:eventoId/formulario/inscricoes/:id/confirmar
  app.post(
    '/api/eventos/:eventoId/formulario/inscricoes/:id/confirmar',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const { id } = request.params as { eventoId: string; id: string }
      if (!uuidSchema.safeParse(id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await inscricaoService.confirmarInscricao(id, request.user.id)
        if (!updated) return reply.status(404).send({ error: 'Inscricao nao encontrada' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao confirmar inscricao')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /api/eventos/:eventoId/formulario/inscricoes/:id/cancelar
  app.post(
    '/api/eventos/:eventoId/formulario/inscricoes/:id/cancelar',
    { preHandler: [authenticate, authorize(['coordenador'])] },
    async (request, reply) => {
      const { id } = request.params as { eventoId: string; id: string }
      if (!uuidSchema.safeParse(id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await inscricaoService.cancelarInscricao(id)
        if (!updated) return reply.status(404).send({ error: 'Inscricao nao encontrada' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao cancelar inscricao')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // POST /api/eventos/:eventoId/formulario/inscricoes/:id/checkin
  app.post(
    '/api/eventos/:eventoId/formulario/inscricoes/:id/checkin',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const { id } = request.params as { eventoId: string; id: string }
      if (!uuidSchema.safeParse(id).success) {
        return reply.status(400).send({ error: 'ID invalido' })
      }
      try {
        const updated = await inscricaoService.checkinInscricao(id, request.user.id)
        if (!updated) return reply.status(404).send({ error: 'Inscricao nao encontrada' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao registrar checkin')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )

  // PATCH /api/eventos/:eventoId/formulario/inscricoes/:id/obs
  app.patch(
    '/api/eventos/:eventoId/formulario/inscricoes/:id/obs',
    { preHandler: [authenticate, authorize(['coordenador', 'lider'])] },
    async (request, reply) => {
      const { id } = request.params as { eventoId: string; id: string }
      const result = obsAdminSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados invalidos' })
      }
      try {
        const updated = await inscricaoService.atualizarObsAdmin(id, result.data.obs)
        if (!updated) return reply.status(404).send({ error: 'Inscricao nao encontrada' })
        return reply.status(200).send(updated)
      } catch (err) {
        request.log.error({ err }, 'Erro ao atualizar obs')
        return reply.status(500).send({ error: 'Erro interno' })
      }
    },
  )
}

// ── Rota pública de inscrição (sem autenticação) ──────────────────────────────

export async function inscricaoPublicaRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/inscricao/:slug — obtém formulário público
  app.get('/api/inscricao/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    try {
      const form = await inscricaoService.obterFormularioPorSlug(slug)
      if (!form) return reply.status(404).send({ error: 'Formulario nao encontrado' })
      // Não expõe instrucoesPagamento antes de inscrever
      const { instrucoesPagamento: _, ...publico } = form
      return reply.status(200).send(publico)
    } catch (err) {
      request.log.error({ err }, 'Erro ao obter formulario publico')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  // POST /api/inscricao/:slug — submeter inscrição
  app.post('/api/inscricao/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const result = inscricaoPublicaSchema.safeParse(request.body)
    if (!result.success) {
      return reply
        .status(400)
        .send({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors })
    }
    try {
      const insc = await inscricaoService.inscrever(slug, result.data)
      return reply.status(201).send(insc)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'FORMULARIO_NAO_ENCONTRADO')
        return reply.status(404).send({ error: 'Formulario nao encontrado' })
      if (msg === 'FORMULARIO_INATIVO')
        return reply.status(409).send({ error: 'As inscricoes estao encerradas' })
      if (msg === 'SEM_VAGAS')
        return reply.status(409).send({ error: 'Nao ha vagas disponiveis' })
      if (msg === 'PRAZO_ENCERRADO')
        return reply.status(409).send({ error: 'O prazo de inscricao foi encerrado' })
      request.log.error({ err }, 'Erro ao inscrever')
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })
}
