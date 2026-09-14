import { eq, and, desc, sql, inArray, ilike } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  formulariosInscricao,
  camposFormulario,
  inscricoes,
  respostasInscricao,
  usuarios,
} from '../db/schema/index.js'

// ── Tipos auxiliares ──────────────────────────────────────────────────────────

export interface CampoPayload {
  id?: string
  rotulo: string
  tipo: 'texto' | 'textarea' | 'select' | 'checkbox'
  opcoes?: string[]
  obrigatorio: boolean
  ordem: number
}

export interface FormularioPayload {
  titulo: string
  descricao?: string
  coletarTelefone?: boolean
  coletarEmail?: boolean
  valorInscricao?: string
  instrucoesPagamento?: string
  ativo?: boolean
  dataLimite?: Date | null
  vagas?: number | null
  campos?: CampoPayload[]
}

export interface InscricaoPublicaPayload {
  nome: string
  email?: string
  telefone?: string
  respostas?: Array<{ campoId: string; valor: string }>
}

export interface FiltrosInscricao {
  status?: string
  busca?: string
  page?: number
  limit?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 190)
}

async function slugUnico(base: string, excluirId?: string): Promise<string> {
  let candidato = base
  let sufixo = 0
  while (true) {
    const rows = await db
      .select({ id: formulariosInscricao.id })
      .from(formulariosInscricao)
      .where(eq(formulariosInscricao.slug, candidato))
      .limit(1)
    if (rows.length === 0 || rows[0]?.id === excluirId) return candidato
    sufixo++
    candidato = `${base}-${sufixo}`
  }
}

// ── Serviço ───────────────────────────────────────────────────────────────────

export class InscricaoService {
  // ── Formulário ────────────────────────────────────────────────────────────

  async obterFormularioPorEvento(eventoId: string) {
    const [form] = await db
      .select()
      .from(formulariosInscricao)
      .where(eq(formulariosInscricao.eventoId, eventoId))
      .limit(1)
    if (!form) return null

    const campos = await db
      .select()
      .from(camposFormulario)
      .where(eq(camposFormulario.formularioId, form.id))
      .orderBy(camposFormulario.ordem)

    return { ...form, campos }
  }

  async obterFormularioPorSlug(slug: string) {
    const [form] = await db
      .select()
      .from(formulariosInscricao)
      .where(and(eq(formulariosInscricao.slug, slug), eq(formulariosInscricao.ativo, true)))
      .limit(1)
    if (!form) return null

    const campos = await db
      .select()
      .from(camposFormulario)
      .where(eq(camposFormulario.formularioId, form.id))
      .orderBy(camposFormulario.ordem)

    return { ...form, campos }
  }

  async criarOuAtualizarFormulario(eventoId: string, payload: FormularioPayload) {
    const { campos: camposPayload, ...dadosForm } = payload

    // Verifica se já existe
    const [existente] = await db
      .select({ id: formulariosInscricao.id, slug: formulariosInscricao.slug })
      .from(formulariosInscricao)
      .where(eq(formulariosInscricao.eventoId, eventoId))
      .limit(1)

    let formularioId: string

    if (existente) {
      formularioId = existente.id
      await db
        .update(formulariosInscricao)
        .set({ ...dadosForm, atualizadoEm: new Date() })
        .where(eq(formulariosInscricao.id, formularioId))
    } else {
      const baseSlug = slugify(dadosForm.titulo)
      const slug = await slugUnico(baseSlug)
      const [novo] = await db
        .insert(formulariosInscricao)
        .values({ eventoId, slug, ...dadosForm })
        .returning({ id: formulariosInscricao.id })
      formularioId = novo!.id
    }

    // Sincroniza campos: remove os antigos e insere os novos
    if (camposPayload !== undefined) {
      await db
        .delete(camposFormulario)
        .where(eq(camposFormulario.formularioId, formularioId))

      if (camposPayload.length > 0) {
        await db.insert(camposFormulario).values(
          camposPayload.map((c, i) => ({
            formularioId,
            rotulo: c.rotulo,
            tipo: c.tipo,
            opcoes: c.opcoes ?? null,
            obrigatorio: c.obrigatorio,
            ordem: c.ordem ?? i,
          })),
        )
      }
    }

    return this.obterFormularioPorEvento(eventoId)
  }

  async alternarAtivo(eventoId: string, ativo: boolean) {
    await db
      .update(formulariosInscricao)
      .set({ ativo, atualizadoEm: new Date() })
      .where(eq(formulariosInscricao.eventoId, eventoId))
  }

  // ── Inscrição pública ──────────────────────────────────────────────────────

  async inscrever(slug: string, payload: InscricaoPublicaPayload) {
    const form = await this.obterFormularioPorSlug(slug)
    if (!form) throw new Error('FORMULARIO_NAO_ENCONTRADO')
    if (!form.ativo) throw new Error('FORMULARIO_INATIVO')

    // Verifica vagas
    if (form.vagas !== null && form.vagas !== undefined) {
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(inscricoes)
        .where(
          and(
            eq(inscricoes.formularioId, form.id),
            inArray(inscricoes.status, ['pendente_pagamento', 'pago', 'confirmado']),
          ),
        )
      if (total >= form.vagas) throw new Error('SEM_VAGAS')
    }

    // Verifica prazo
    if (form.dataLimite && new Date() > form.dataLimite) {
      throw new Error('PRAZO_ENCERRADO')
    }

    // Cria inscrição — status inicial depende do valor
    const valorNum = parseFloat(form.valorInscricao ?? '0')
    const statusInicial = valorNum > 0 ? 'pendente_pagamento' : 'confirmado'

    const [inscricao] = await db
      .insert(inscricoes)
      .values({
        formularioId: form.id,
        eventoId: form.eventoId,
        nome: payload.nome,
        email: payload.email,
        telefone: payload.telefone,
        status: statusInicial,
      })
      .returning()

    // Salva respostas dos campos extras
    if (payload.respostas && payload.respostas.length > 0) {
      await db.insert(respostasInscricao).values(
        payload.respostas.map((r) => ({
          inscricaoId: inscricao!.id,
          campoId: r.campoId,
          valor: r.valor,
        })),
      )
    }

    return { ...inscricao, instrucoesPagamento: form.instrucoesPagamento }
  }

  // ── Gestão das inscrições (admin) ──────────────────────────────────────────

  async listarInscricoes(eventoId: string, filtros: FiltrosInscricao = {}) {
    const page = Math.max(1, filtros.page ?? 1)
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions = [eq(inscricoes.eventoId, eventoId)]

    if (filtros.status) {
      conditions.push(eq(inscricoes.status, filtros.status))
    }

    if (filtros.busca) {
      conditions.push(ilike(inscricoes.nome, `%${filtros.busca}%`))
    }

    const where = and(...conditions)

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(inscricoes)
      .where(where)

    const data = await db
      .select()
      .from(inscricoes)
      .where(where)
      .orderBy(desc(inscricoes.criadoEm))
      .limit(limit)
      .offset(offset)

    return { data, total, page, limit }
  }

  async buscarInscricaoPorId(id: string) {
    const [insc] = await db
      .select()
      .from(inscricoes)
      .where(eq(inscricoes.id, id))
      .limit(1)
    if (!insc) return null

    const respostas = await db
      .select({
        campoId: respostasInscricao.campoId,
        rotulo: camposFormulario.rotulo,
        valor: respostasInscricao.valor,
      })
      .from(respostasInscricao)
      .innerJoin(camposFormulario, eq(camposFormulario.id, respostasInscricao.campoId))
      .where(eq(respostasInscricao.inscricaoId, id))

    return { ...insc, respostas }
  }

  async confirmarPagamento(inscricaoId: string, adminId: string) {
    const [updated] = await db
      .update(inscricoes)
      .set({
        status: 'pago',
        pagamentoConfirmadoPor: adminId,
        pagamentoConfirmadoEm: new Date(),
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(inscricoes.id, inscricaoId),
          eq(inscricoes.status, 'pendente_pagamento'),
        ),
      )
      .returning()
    return updated ?? null
  }

  async confirmarInscricao(inscricaoId: string, adminId: string) {
    const [updated] = await db
      .update(inscricoes)
      .set({
        status: 'confirmado',
        pagamentoConfirmadoPor: adminId,
        pagamentoConfirmadoEm: new Date(),
        atualizadoEm: new Date(),
      })
      .where(eq(inscricoes.id, inscricaoId))
      .returning()
    return updated ?? null
  }

  async cancelarInscricao(inscricaoId: string) {
    const [updated] = await db
      .update(inscricoes)
      .set({ status: 'cancelado', atualizadoEm: new Date() })
      .where(eq(inscricoes.id, inscricaoId))
      .returning()
    return updated ?? null
  }

  async checkinInscricao(inscricaoId: string, adminId: string) {
    const [updated] = await db
      .update(inscricoes)
      .set({
        checkinEm: new Date(),
        checkinConfirmadoPor: adminId,
        atualizadoEm: new Date(),
      })
      .where(eq(inscricoes.id, inscricaoId))
      .returning()
    return updated ?? null
  }

  async atualizarObsAdmin(inscricaoId: string, obs: string) {
    const [updated] = await db
      .update(inscricoes)
      .set({ obsAdmin: obs, atualizadoEm: new Date() })
      .where(eq(inscricoes.id, inscricaoId))
      .returning()
    return updated ?? null
  }
}

export const inscricaoService = new InscricaoService()
