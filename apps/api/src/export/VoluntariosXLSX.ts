import ExcelJS from 'exceljs'
import { eq, or, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { voluntarios, equipeVoluntarios, equipes, funcoes } from '../db/schema/index.js'

const COR_CABECALHO = '1e3a5f'

const STATUS_LABEL: Record<string, string> = {
  aceito:   'Confirmado',
  recusado: 'Recusou',
  pendente: 'Pendente',
}

export async function gerarVoluntariosXLSX(eventoId: string, db: Db): Promise<Buffer> {
  const rows = await db
    .selectDistinct({
      nome:               voluntarios.nome,
      email:              voluntarios.email,
      telefone:           voluntarios.telefone,
      obs:                voluntarios.obs,
      equipeNome:         equipes.nome,
      funcaoNome:         funcoes.nome,
      statusConvite:      voluntarios.statusConvite,
      observacaoConvite:  voluntarios.observacaoConvite,
      dataResposta:       voluntarios.dataResposta,
    })
    .from(voluntarios)
    .leftJoin(equipeVoluntarios, eq(equipeVoluntarios.voluntarioId, voluntarios.id))
    .leftJoin(equipes, eq(equipes.id, equipeVoluntarios.equipeId))
    .leftJoin(funcoes, eq(funcoes.id, equipeVoluntarios.funcaoId))
    .where(
      or(
        eq(voluntarios.eventoId, eventoId),
        eq(equipes.eventoId, eventoId),
      ),
    )
    .orderBy(asc(voluntarios.nome))

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Retiro Jovens'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Voluntários')

  sheet.columns = [
    { header: 'Nome',             key: 'nome',              width: 30 },
    { header: 'Email',            key: 'email',             width: 30 },
    { header: 'Telefone',         key: 'telefone',          width: 18 },
    { header: 'Equipe',           key: 'equipe',            width: 22 },
    { header: 'Função',           key: 'funcao',            width: 22 },
    { header: 'Status Convite',   key: 'statusConvite',     width: 16 },
    { header: 'Obs. Convite',     key: 'obsConvite',        width: 35 },
    { header: 'Data Resposta',    key: 'dataResposta',      width: 20 },
    { header: 'Observações',      key: 'obs',               width: 40 },
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
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  })
  cabecalho.height = 20

  for (const r of rows) {
    sheet.addRow({
      nome:           r.nome,
      email:          r.email ?? '',
      telefone:       r.telefone ?? '',
      equipe:         r.equipeNome ?? '',
      funcao:         r.funcaoNome ?? '',
      statusConvite:  STATUS_LABEL[r.statusConvite ?? 'pendente'] ?? r.statusConvite ?? '',
      obsConvite:     r.observacaoConvite ?? '',
      dataResposta:   r.dataResposta
        ? new Date(r.dataResposta).toLocaleString('pt-BR')
        : '',
      obs:            r.obs ?? '',
    })
  }

  // Ajusta largura de cada coluna pelo conteúdo
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
