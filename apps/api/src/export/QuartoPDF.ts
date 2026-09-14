import PDFDocument from 'pdfkit'
import { eq, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { eventos, quartos, participantes, equipes } from '../db/schema/index.js'

const COR_PRINCIPAL = '#1e3a5f'
const COR_ACENTO = '#2563eb'
const MARGEM = 40

export async function gerarQuartoPDF(eventoId: string, quartoId: string, db: Db): Promise<Buffer> {
  const [evento] = await db
    .select({ nome: eventos.nome })
    .from(eventos)
    .where(eq(eventos.id, eventoId))
    .limit(1)

  if (!evento) throw new Error('Evento nao encontrado')

  const [quarto] = await db
    .select()
    .from(quartos)
    .where(eq(quartos.id, quartoId))
    .limit(1)

  if (!quarto) throw new Error('Quarto nao encontrado')

  const rows = await db
    .select({
      nome: participantes.nome,
      email: participantes.email,
      telefone: participantes.telefone,
      status: participantes.status,
      equipeNome: equipes.nome,
      obs: participantes.obs,
      checkinEm: participantes.checkinEm,
    })
    .from(participantes)
    .leftJoin(equipes, eq(participantes.equipeId, equipes.id))
    .where(eq(participantes.quartoId, quartoId))
    .orderBy(asc(participantes.nome))

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGEM, bottom: MARGEM, left: MARGEM, right: MARGEM },
      bufferPages: true,
      info: { Title: `Lista de Quarto — ${quarto.nome}` },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Cabeçalho
    doc.fillColor(COR_PRINCIPAL).fontSize(18).text(evento.nome, { align: 'center' })
    doc.moveDown(0.3)
    doc
      .fillColor(COR_ACENTO)
      .fontSize(14)
      .text(`Lista de Acomodação: ${quarto.nome}`, { align: 'center' })
    doc.moveDown(0.2)

    // Informações do Quarto
    doc.fillColor('#4b5563').fontSize(10)
    const detalhes = [
      `Gênero: ${quarto.genero ?? 'Misto'}`,
      `Capacidade: ${rows.length}/${quarto.capacidade}`,
      quarto.responsavelNome ? `Responsável: ${quarto.responsavelNome}` : null,
      quarto.localizacao ? `Localização: ${quarto.localizacao}` : null,
    ]
      .filter(Boolean)
      .join('  •  ')

    doc.text(detalhes, { align: 'center' })
    if (quarto.obs) {
      doc.moveDown(0.2)
      doc.fontSize(9).text(`Obs: ${quarto.obs}`, { align: 'center' })
    }

    doc.moveDown(0.8)
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(MARGEM, doc.y)
      .lineTo(doc.page.width - MARGEM, doc.y)
      .stroke()
    doc.moveDown(0.8)

    // Tabela de Integrantes
    const colX = {
      num: MARGEM,
      nome: MARGEM + 30,
      telefone: MARGEM + 220,
      equipe: MARGEM + 340,
      checkin: MARGEM + 440,
    }

    // Header da tabela
    const yHeader = doc.y
    doc.rect(MARGEM, yHeader - 4, doc.page.width - MARGEM * 2, 20).fill('#f3f4f6')
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
    doc.text('#', colX.num, yHeader)
    doc.text('Nome do Participante', colX.nome, yHeader)
    doc.text('Telefone / Contato', colX.telefone, yHeader)
    doc.text('Equipe / Grupo', colX.equipe, yHeader)
    doc.text('Check-in', colX.checkin, yHeader)

    doc.font('Helvetica')
    doc.moveDown(1)

    if (rows.length === 0) {
      doc.moveDown(1)
      doc
        .fillColor('#9ca3af')
        .fontSize(10)
        .text('Nenhum participante alocado neste quarto.', { align: 'center' })
    } else {
      rows.forEach((p, idx) => {
        const yRow = doc.y
        if (yRow > doc.page.height - MARGEM - 40) {
          doc.addPage()
        }

        // Alternar cor de fundo suave
        if (idx % 2 === 1) {
          doc
            .rect(MARGEM, doc.y - 2, doc.page.width - MARGEM * 2, 18)
            .fill('#f9fafb')
        }

        doc.fillColor('#111827').fontSize(9)
        doc.text(String(idx + 1), colX.num, doc.y)
        doc.text(p.nome, colX.nome, doc.y, { width: 180, lineBreak: false })
        doc.text(p.telefone || p.email || '—', colX.telefone, doc.y, {
          width: 110,
          lineBreak: false,
        })
        doc.text(p.equipeNome || '—', colX.equipe, doc.y, { width: 95, lineBreak: false })
        doc.text(p.checkinEm ? 'Sim' : 'Não', colX.checkin, doc.y)

        doc.moveDown(0.8)
      })
    }

    // Vagas restantes (linhas vazias para preenchimento se houver vagas)
    const vagasLivres = Math.max(0, quarto.capacidade - rows.length)
    if (vagasLivres > 0) {
      doc.moveDown(0.5)
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Oblique')
      doc.text(`[ ${vagasLivres} vaga(s) disponível(is) no quarto ]`, MARGEM + 30, doc.y)
      doc.font('Helvetica')
    }

    // Rodapé
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      const dataHora = new Date().toLocaleString('pt-BR')
      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .text(
          `Gerado em ${dataHora} — Retiro Jovens | Página ${i + 1} de ${range.count}`,
          MARGEM,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - MARGEM * 2 },
        )
    }

    doc.end()
  })
}
