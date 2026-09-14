import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { voluntarios, equipeVoluntarios, equipes, funcoes } from '../db/schema/index.js'

// ── Geração de slug ────────────────────────────────────────────────────────────

function sanitizeSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function gerarSlugUnico(nomeBase: string): Promise<string> {
  const base = sanitizeSlug(nomeBase)
  // Verifica se o slug base está disponível
  const [existente] = await db
    .select({ slug: voluntarios.slug })
    .from(voluntarios)
    .where(eq(voluntarios.slug, base))
    .limit(1)

  if (!existente) return base

  // Incrementa sufixo até encontrar disponível
  let contador = 2
  while (true) {
    const candidato = `${base}-${contador}`
    const [conflito] = await db
      .select({ slug: voluntarios.slug })
      .from(voluntarios)
      .where(eq(voluntarios.slug, candidato))
      .limit(1)
    if (!conflito) return candidato
    contador++
  }
}

// ── Tipo de retorno do convite público ────────────────────────────────────────

export interface ConvitePublico {
  id: string
  nome: string
  slug: string
  statusConvite: string
  observacaoConvite: string | null
  dataResposta: Date | null
  visualizadoEm: Date | null
  // Equipe e função do voluntário no evento
  equipeNome: string | null
  funcaoNome: string | null
  eventoId: string | null
  eventoNome: string | null
  tituloConvite: string | null
  mensagemConvite: string | null
  arteUrl: string | null
}

export class ConviteService {
  // Gera (ou regenera) o slug de convite para um voluntário
  async gerarConvite(voluntarioId: string): Promise<{ slug: string }> {
    const [vol] = await db
      .select()
      .from(voluntarios)
      .where(eq(voluntarios.id, voluntarioId))
      .limit(1)

    if (!vol) throw new Error('Voluntario nao encontrado')

    // Se já tem slug, retorna o existente
    if (vol.slug) return { slug: vol.slug }

    const slug = await gerarSlugUnico(vol.nome)
    await db
      .update(voluntarios)
      .set({ slug, statusConvite: 'pendente', atualizadoEm: new Date() })
      .where(eq(voluntarios.id, voluntarioId))

    return { slug }
  }

  // Busca dados públicos do convite pelo slug
  async buscarPorSlug(slug: string): Promise<ConvitePublico | null> {
    const [vol] = await db
      .select()
      .from(voluntarios)
      .where(eq(voluntarios.slug, slug))
      .limit(1)

    if (!vol) return null

    // Busca equipe e função do voluntário (pode estar em múltiplas equipes — pega a primeira)
    const membros = await db
      .select({
        equipeNome: equipes.nome,
        funcaoNome: funcoes.nome,
        eventoId: equipes.eventoId,
      })
      .from(equipeVoluntarios)
      .leftJoin(equipes, eq(equipes.id, equipeVoluntarios.equipeId))
      .leftJoin(funcoes, eq(funcoes.id, equipeVoluntarios.funcaoId))
      .where(eq(equipeVoluntarios.voluntarioId, vol.id))
      .limit(1)

    const membro = membros[0] ?? null

    return {
      id: vol.id,
      nome: vol.nome,
      slug: vol.slug!,
      statusConvite: vol.statusConvite ?? 'pendente',
      observacaoConvite: vol.observacaoConvite ?? null,
      dataResposta: vol.dataResposta ?? null,
      visualizadoEm: vol.visualizadoEm ?? null,
      equipeNome: membro?.equipeNome ?? null,
      funcaoNome: membro?.funcaoNome ?? null,
      eventoId: membro?.eventoId ?? null,
      eventoNome: null, // enriquecido abaixo se necessário
      tituloConvite: vol.tituloConvite ?? null,
      mensagemConvite: vol.mensagemConvite ?? null,
      arteUrl: vol.arteUrl ?? null,
    }
  }

  // Registra visualização somente na primeira vez
  async marcarVisualizacao(slug: string): Promise<void> {
    const [vol] = await db
      .select({ id: voluntarios.id, visualizadoEm: voluntarios.visualizadoEm })
      .from(voluntarios)
      .where(eq(voluntarios.slug, slug))
      .limit(1)

    if (!vol || vol.visualizadoEm) return

    await db
      .update(voluntarios)
      .set({ visualizadoEm: new Date() })
      .where(eq(voluntarios.id, vol.id))
  }

  // Registra resposta do voluntário
  async registrarResposta(
    slug: string,
    status: 'aceito' | 'recusado',
    observacao: string,
  ): Promise<ConvitePublico | null> {
    const [vol] = await db
      .select({ id: voluntarios.id })
      .from(voluntarios)
      .where(eq(voluntarios.slug, slug))
      .limit(1)

    if (!vol) return null

    await db
      .update(voluntarios)
      .set({
        statusConvite: status,
        observacaoConvite: observacao,
        dataResposta: new Date(),
        atualizadoEm: new Date(),
      })
      .where(eq(voluntarios.id, vol.id))

    return this.buscarPorSlug(slug)
  }

  // Listar voluntários de um evento com dados de convite (para o admin)
  async listarComConvite(eventoId: string) {
    const rows = await db
      .select({
        id: voluntarios.id,
        nome: voluntarios.nome,
        email: voluntarios.email,
        telefone: voluntarios.telefone,
        obs: voluntarios.obs,
        slug: voluntarios.slug,
        statusConvite: voluntarios.statusConvite,
        observacaoConvite: voluntarios.observacaoConvite,
        dataResposta: voluntarios.dataResposta,
        visualizadoEm: voluntarios.visualizadoEm,
        tituloConvite: voluntarios.tituloConvite,
        mensagemConvite: voluntarios.mensagemConvite,
        arteUrl: voluntarios.arteUrl,
        criadoEm: voluntarios.criadoEm,
        atualizadoEm: voluntarios.atualizadoEm,
        equipeId: equipeVoluntarios.equipeId,
        funcaoId: equipeVoluntarios.funcaoId,
      })
      .from(voluntarios)
      .innerJoin(equipeVoluntarios, eq(equipeVoluntarios.voluntarioId, voluntarios.id))
      .innerJoin(equipes, eq(equipes.id, equipeVoluntarios.equipeId))
      .where(eq(equipes.eventoId, eventoId))

    return rows
  }
}

export const conviteService = new ConviteService()
