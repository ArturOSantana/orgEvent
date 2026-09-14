import ExcelJS from 'exceljs'
import { eq, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { materiais, usuarios } from '../db/schema/index.js'

const COR_CABECALHO = '1e3a5f'

export async function gerarMateriaisXLSX(eventoId: string, db: Db): Promise<Buffer> {
  const rows = await db
    .select({
      nome:            materiais.nome,
      quantidade:      materiais.quantidade,
      unidade:         materiais.unidade,
      status:          materiais.status,
      responsavelNome: usuarios.nome,
      obs:             materiais.obs,
    })
    .from(materiais)
    .leftJoin(usuarios, eq(materiais.responsavelId, usuarios.id))
    .where(eq(materiais.eventoId, eventoId))
    .orderBy(asc(materiais.nome))

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Retiro Jovens'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Materiais')

  sheet.columns = [
    { header: 'Nome',         key: 'nome',        width: 30 },
    { header: 'Quantidade',   key: 'quantidade',  width: 14 },
    { header: 'Unidade',      key: 'unidade',     width: 14 },
    { header: 'Status',       key: 'status',      width: 15 },
    { header: 'Responsável',  key: 'responsavel', width: 25 },
    { header: 'Observações',  key: 'obs',         width: 40 },
  ]

  // Formatar linha de cabecalho
  const cabecalho = sheet.getRow(1)
  cabecalho.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${COR_CABECALHO}` },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  })
  cabecalho.height = 20

  // Adicionar dados
  for (const r of rows) {
    sheet.addRow({
      nome:        r.nome,
      quantidade:  r.quantidade !== null ? Number(r.quantidade) : '',
      unidade:     r.unidade ?? '',
      status:      r.status,
      responsavel: r.responsavelNome ?? '',
      obs:         r.obs ?? '',
    })
  }

  // Auto-width: ajusta pela largura do conteudo
  sheet.columns.forEach((col) => {
    let maxLen = (col.header as string).length
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value
      if (v !== null && v !== undefined) {
        const len = String(v).length
        if (len > maxLen) maxLen = len
      }
    })
    col.width = Math.min(maxLen + 4, 60)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
