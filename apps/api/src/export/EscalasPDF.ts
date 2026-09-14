import PDFDocument from 'pdfkit'
import { eq, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { eventos, equipes, equipeVoluntarios, voluntarios, funcoes } from '../db/schema/index.js'

const COR_PRINCIPAL = '#1e3a5f'
const MARGEM = 40

export async function gerarEscalasPDF(eventoId: string, db: Db): Promise<Buffer> {
  const [evento] = await db
    .select()
    .from(eventos)
    .where(eq(eventos.id, eventoId))
    .limit(1)

  if (!evento) {
    throw new Error('Evento nao encontrado')
  }

  const equipesDoEvento = await db
    .select()
    .from(equipes)
    .where(eq(equipes.eventoId, eventoId))
    .orderBy(asc(equipes.nome))

  // Busca todos os membros com voluntarios e funcoes de uma vez
  const membros = await db
    .select({
      equipeId: equipeVoluntarios.equipeId,
      voluntarioNome: voluntarios.nome,
      funcaoNome: funcoes.nome,
    })
    .from(equipeVoluntarios)
    .innerJoin(voluntarios, eq(equipeVoluntarios.voluntarioId, voluntarios.id))
    .leftJoin(funcoes, eq(equipeVoluntarios.funcaoId, funcoes.id))
    .orderBy(asc(voluntarios.nome))

  // Agrupa por equipeId
  const membrosPorEquipe = new Map<string, Array<{ nome: string; funcao: string | null }>>()
  for (const m of membros) {
    if (!membrosPorEquipe.has(m.equipeId)) membrosPorEquipe.set(m.equipeId, [])
    membrosPorEquipe.get(m.equipeId)!.push({ nome: m.voluntarioNome, funcao: m.funcaoNome ?? null })
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGEM, bottom: MARGEM, left: MARGEM, right: MARGEM },
      bufferPages: true,
      info: { Title: `Escalas — ${evento.nome}` },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const larguraUtil = doc.page.width - MARGEM * 2

    // Cabecalho
    doc
      .fillColor(COR_PRINCIPAL)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(`Escalas — ${evento.nome}`, MARGEM, MARGEM, { width: larguraUtil })

    doc.moveDown(0.5)
    doc
      .moveTo(MARGEM, doc.y)
      .lineTo(MARGEM + larguraUtil, doc.y)
      .strokeColor(COR_PRINCIPAL)
      .lineWidth(1.5)
      .stroke()
    doc.moveDown(0.8)

    for (const equipe of equipesDoEvento) {
      // Nome da equipe
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor(COR_PRINCIPAL)
        .text(equipe.nome, MARGEM, doc.y, { width: larguraUtil })
      doc.moveDown(0.3)

      const listaMembers = membrosPorEquipe.get(equipe.id) ?? []

      if (listaMembers.length === 0) {
        doc
          .fontSize(10)
          .font('Helvetica-Oblique')
          .fillColor('#888888')
          .text('Nenhum membro cadastrado.', MARGEM + 12, doc.y, { width: larguraUtil - 12 })
        doc.moveDown(0.5)
        continue
      }

      // Cabecalho da tabela
      const colNome = MARGEM + 12
      const colFuncao = MARGEM + 12 + (larguraUtil - 12) * 0.55
      const alturaCabec = doc.y

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .rect(MARGEM + 10, alturaCabec - 2, larguraUtil - 10, 16)
        .fill(COR_PRINCIPAL)

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('Nome', colNome, alturaCabec, { width: colFuncao - colNome - 4, lineBreak: false })
        .text('Função', colFuncao, alturaCabec, { width: larguraUtil + MARGEM - colFuncao, lineBreak: false })

      doc.moveDown(0.8)

      // Linhas da tabela
      let alternar = false
      for (const membro of listaMembers) {
        const yLinha = doc.y
        if (alternar) {
          doc.rect(MARGEM + 10, yLinha - 2, larguraUtil - 10, 14).fill('#f0f4fa')
        }
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#222222')
          .text(membro.nome, colNome, yLinha, { width: colFuncao - colNome - 4, lineBreak: false })
          .text(membro.funcao ?? '—', colFuncao, yLinha, { width: larguraUtil + MARGEM - colFuncao, lineBreak: false })
        doc.moveDown(0.5)
        alternar = !alternar
      }

      doc.moveDown(0.8)
    }

    // Rodape com numero de pagina
    const totalPaginas = (doc as unknown as { bufferedPageRange(): { count: number } }).bufferedPageRange().count
    for (let i = 0; i < totalPaginas; i++) {
      doc.switchToPage(i)
      const yRodape = doc.page.height - MARGEM + 10
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#888888')
        .text(`Página ${i + 1} de ${totalPaginas}`, MARGEM, yRodape, {
          width: larguraUtil,
          align: 'right',
        })
    }

    doc.end()
  })
}
