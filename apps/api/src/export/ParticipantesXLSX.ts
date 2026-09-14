import ExcelJS from 'exceljs'
import { eq, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { participantes, equipes } from '../db/schema/index.js'

const COR_CABECALHO = '1e3a5f'

export async function gerarParticipantesXLSX(eventoId: string, db: Db): Promise<Buffer> {
  const rows = await db
    .select({
      nome: participantes.nome,
      email: participantes.email,
      telefone: participantes.telefone,
      status: participantes.status,
      equipeNome: equipes.nome,
      obs: participantes.obs,
    })
    .from(participantes)
    .leftJoin(equipes, eq(participantes.equipeId, equipes.id))
    .where(eq(participantes.eventoId, eventoId))
    .orderBy(asc(participantes.nome))

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Retiro Jovens'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Participantes')

  sheet.columns = [
    { header: 'Nome',        key: 'nome',      width: 30 },
    { header: 'Email',       key: 'email',     width: 30 },
    { header: 'Telefone',    key: 'telefone',  width: 18 },
    { header: 'Status',      key: 'status',    width: 15 },
    { header: 'Equipe',      key: 'equipe',    width: 22 },
    { header: 'Observações', key: 'obs',       width: 40 },
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
      nome:     r.nome,
      email:    r.email ?? '',
      telefone: r.telefone ?? '',
      status:   r.status,
      equipe:   r.equipeNome ?? '',
      obs:      r.obs ?? '',
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
