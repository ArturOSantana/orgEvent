import ExcelJS from 'exceljs'
import { eq, asc, inArray } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { inscricoes, camposFormulario, respostasInscricao, formulariosInscricao } from '../db/schema/index.js'

const COR_CABECALHO = '1e3a5f'

const STATUS_LABEL: Record<string, string> = {
  pendente_pagamento: 'Aguard. pagamento',
  pago: 'Pago',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

export async function gerarInscricoesXLSX(eventoId: string, db: Db): Promise<Buffer> {
  // Busca campos extras do formulário deste evento
  const [form] = await db
    .select({ id: formulariosInscricao.id })
    .from(formulariosInscricao)
    .where(eq(formulariosInscricao.eventoId, eventoId))
    .limit(1)

  const camposExtras = form
    ? await db
        .select({ id: camposFormulario.id, rotulo: camposFormulario.rotulo })
        .from(camposFormulario)
        .where(eq(camposFormulario.formularioId, form.id))
        .orderBy(asc(camposFormulario.ordem))
    : []

  // Busca todas as inscrições do evento
  const rows = await db
    .select()
    .from(inscricoes)
    .where(eq(inscricoes.eventoId, eventoId))
    .orderBy(asc(inscricoes.criadoEm))

  // Mapa rápido: inscricaoId → campoId → valor
  const respostasPorInscricao = new Map<string, Map<string, string>>()
  const inscricaoIds = rows.map((r) => r.id)

  if (inscricaoIds.length > 0) {
    const respostasAll = await db
      .select({
        inscricaoId: respostasInscricao.inscricaoId,
        campoId: respostasInscricao.campoId,
        valor: respostasInscricao.valor,
      })
      .from(respostasInscricao)
      .where(inArray(respostasInscricao.inscricaoId, inscricaoIds))
    for (const r of respostasAll) {
      if (!respostasPorInscricao.has(r.inscricaoId)) {
        respostasPorInscricao.set(r.inscricaoId, new Map())
      }
      respostasPorInscricao.get(r.inscricaoId)!.set(r.campoId, r.valor ?? '')
    }
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Retiro Jovens'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Inscrições')

  // Colunas fixas + colunas extras dos campos do formulário
  sheet.columns = [
    { header: 'Nome',         key: 'nome',        width: 30 },
    { header: 'E-mail',       key: 'email',       width: 30 },
    { header: 'Telefone',     key: 'telefone',    width: 18 },
    { header: 'Status',       key: 'status',      width: 20 },
    { header: 'Check-in',     key: 'checkin',     width: 18 },
    { header: 'Inscrito em',  key: 'criadoEm',    width: 18 },
    { header: 'Obs. Admin',   key: 'obsAdmin',    width: 35 },
    ...camposExtras.map((c) => ({
      header: c.rotulo,
      key: `campo_${c.id}`,
      width: 25,
    })),
  ]

  // Cabeçalho estilizado
  const cabecalho = sheet.getRow(1)
  cabecalho.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${COR_CABECALHO}` },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } }
  })
  cabecalho.height = 20

  const fmt = (iso: Date | string | null | undefined) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  for (const insc of rows) {
    const respostasInsc = respostasPorInscricao.get(insc.id) ?? new Map()
    const camposRow: Record<string, string> = {}
    for (const c of camposExtras) {
      camposRow[`campo_${c.id}`] = respostasInsc.get(c.id) ?? ''
    }
    sheet.addRow({
      nome:      insc.nome,
      email:     insc.email ?? '',
      telefone:  insc.telefone ?? '',
      status:    STATUS_LABEL[insc.status] ?? insc.status,
      checkin:   fmt(insc.checkinEm),
      criadoEm:  fmt(insc.criadoEm),
      obsAdmin:  insc.obsAdmin ?? '',
      ...camposRow,
    })
  }

  // Auto-width
  sheet.columns.forEach((col) => {
    let maxLen = String(col.header ?? '').length
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 4, 60)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
