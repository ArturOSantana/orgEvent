import PDFDocument from 'pdfkit'
import { eq, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { eventos, fases, horarios } from '../db/schema/index.js'

const COR_PRINCIPAL = '#1e3a5f'
const MARGEM = 40

function formatarData(dataStr: string): string {
  // dataStr vem como 'YYYY-MM-DD'
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarTimestamp(ts: Date): string {
  const d = ts.toLocaleDateString('pt-BR')
  return d
}

export async function gerarCronogramaPDF(eventoId: string, db: Db): Promise<Buffer> {
  const [evento] = await db
    .select()
    .from(eventos)
    .where(eq(eventos.id, eventoId))
    .limit(1)

  if (!evento) {
    throw new Error('Evento nao encontrado')
  }

  const fasesDoEvento = await db
    .select()
    .from(fases)
    .where(eq(fases.eventoId, eventoId))
    .orderBy(asc(fases.ordem))

  const horariosDoEvento = await db
    .select()
    .from(horarios)
    .where(eq(horarios.eventoId, eventoId))
    .orderBy(asc(horarios.data), asc(horarios.horaInicio))

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGEM, bottom: MARGEM, left: MARGEM, right: MARGEM },
      bufferPages: true,
      info: { Title: `Cronograma — ${evento.nome}` },
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
      .text(evento.nome, MARGEM, MARGEM, { width: larguraUtil })

    doc.moveDown(0.3)
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#333333')

    const localStr = evento.local ? `Local: ${evento.local}` : ''
    const dataInicioStr = formatarTimestamp(evento.dataInicio)
    const dataFimStr = formatarTimestamp(evento.dataFim)
    const periodoStr = `Período: ${dataInicioStr} – ${dataFimStr}`

    if (localStr) {
      doc.text(localStr, { width: larguraUtil })
    }
    doc.text(periodoStr, { width: larguraUtil })

    doc.moveDown(0.5)
    doc
      .moveTo(MARGEM, doc.y)
      .lineTo(MARGEM + larguraUtil, doc.y)
      .strokeColor(COR_PRINCIPAL)
      .lineWidth(1.5)
      .stroke()
    doc.moveDown(0.8)

    // Horarios sem fase agrupados separadamente
    const horariosPorFase = new Map<string | null, typeof horariosDoEvento>()
    for (const h of horariosDoEvento) {
      const chave = h.faseId ?? null
      if (!horariosPorFase.has(chave)) horariosPorFase.set(chave, [])
      horariosPorFase.get(chave)!.push(h)
    }

    const renderizarHorarios = (lista: typeof horariosDoEvento) => {
      for (const h of lista) {
        const dataFmt = formatarData(h.data)
        const linha = `${dataFmt}  ${h.horaInicio}–${h.horaFim}  ${h.titulo}${h.local ? `  •  ${h.local}` : ''}`
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#222222')
          .text(linha, MARGEM + 12, doc.y, { width: larguraUtil - 12 })
        doc.moveDown(0.2)
      }
    }

    for (const fase of fasesDoEvento) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(COR_PRINCIPAL)
        .text(fase.nome, MARGEM, doc.y, { width: larguraUtil })
      doc.moveDown(0.3)

      const horariosDoFase = horariosPorFase.get(fase.id) ?? []
      renderizarHorarios(horariosDoFase)
      doc.moveDown(0.5)
    }

    // Horarios sem fase
    const semFase = horariosPorFase.get(null) ?? []
    if (semFase.length > 0) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(COR_PRINCIPAL)
        .text('Sem fase definida', MARGEM, doc.y, { width: larguraUtil })
      doc.moveDown(0.3)
      renderizarHorarios(semFase)
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
