import PDFDocument from 'pdfkit'
import { eq, or, asc } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { eventos, voluntarios, equipeVoluntarios, equipes, funcoes } from '../db/schema/index.js'

const COR_PRINCIPAL = '#1e3a5f'
const COR_ACENTO    = '#2563eb'
const MARGEM        = 40

const STATUS_LABEL: Record<string, string> = {
  aceito:   'Confirmado',
  recusado: 'Recusou',
  pendente: 'Pendente',
}

const STATUS_COR: Record<string, string> = {
  aceito:   '#16a34a',
  recusado: '#dc2626',
  pendente: '#d97706',
}

export async function gerarVoluntariosPDF(eventoId: string, db: Db): Promise<Buffer> {
  const [evento] = await db
    .select({ nome: eventos.nome })
    .from(eventos)
    .where(eq(eventos.id, eventoId))
    .limit(1)

  if (!evento) throw new Error('Evento nao encontrado')

  const rows = await db
    .selectDistinct({
      nome:              voluntarios.nome,
      email:             voluntarios.email,
      telefone:          voluntarios.telefone,
      obs:               voluntarios.obs,
      equipeNome:        equipes.nome,
      funcaoNome:        funcoes.nome,
      statusConvite:     voluntarios.statusConvite,
      observacaoConvite: voluntarios.observacaoConvite,
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

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGEM, bottom: MARGEM, left: MARGEM, right: MARGEM },
      bufferPages: true,
      info: { Title: `Voluntários — ${evento.nome}` },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const larguraUtil = doc.page.width - MARGEM * 2

    // ── Cabeçalho ────────────────────────────────────────────────────────────
    doc
      .fillColor(COR_PRINCIPAL)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(`Voluntários — ${evento.nome}`, MARGEM, MARGEM, { width: larguraUtil })

    doc.moveDown(0.3)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#555555')
      .text(
        `Total: ${rows.length} voluntário${rows.length !== 1 ? 's' : ''}  ·  Gerado em ${new Date().toLocaleString('pt-BR')}`,
        MARGEM,
        doc.y,
        { width: larguraUtil },
      )

    doc.moveDown(0.5)
    doc
      .moveTo(MARGEM, doc.y)
      .lineTo(MARGEM + larguraUtil, doc.y)
      .strokeColor(COR_PRINCIPAL)
      .lineWidth(1.5)
      .stroke()
    doc.moveDown(0.6)

    // ── Cabeçalho da tabela ──────────────────────────────────────────────────
    const COL = {
      nome:   MARGEM,
      contato: MARGEM + larguraUtil * 0.30,
      equipe:  MARGEM + larguraUtil * 0.55,
      status:  MARGEM + larguraUtil * 0.80,
    }
    const larguraNome    = COL.contato - COL.nome    - 4
    const larguraContato = COL.equipe  - COL.contato - 4
    const larguraEquipe  = COL.status  - COL.equipe  - 4
    const larguraStatus  = MARGEM + larguraUtil - COL.status

    const yCabec = doc.y
    doc
      .rect(MARGEM, yCabec - 2, larguraUtil, 16)
      .fill(COR_PRINCIPAL)

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('Nome',         COL.nome,    yCabec, { width: larguraNome,    lineBreak: false })
      .text('Contato',      COL.contato, yCabec, { width: larguraContato, lineBreak: false })
      .text('Equipe/Função',COL.equipe,  yCabec, { width: larguraEquipe,  lineBreak: false })
      .text('Convite',      COL.status,  yCabec, { width: larguraStatus,  lineBreak: false })

    doc.moveDown(0.8)

    // ── Linhas ───────────────────────────────────────────────────────────────
    let alternar = false
    for (const r of rows) {
      const yLinha = doc.y

      // Fundo zebrado
      if (alternar) {
        doc.rect(MARGEM, yLinha - 2, larguraUtil, 18).fill('#f0f4fa')
      }

      const status     = r.statusConvite ?? 'pendente'
      const statusText = STATUS_LABEL[status] ?? status
      const statusCor  = STATUS_COR[status]   ?? '#555555'

      const contatoLinhas = [r.email, r.telefone].filter(Boolean).join('\n') || '—'
      const equipeLinhas  = [r.equipeNome, r.funcaoNome].filter(Boolean).join('\n') || '—'

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text(r.nome, COL.nome, yLinha, { width: larguraNome, lineBreak: false })

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#444444')
        .text(contatoLinhas, COL.contato, yLinha, { width: larguraContato, lineBreak: false })
        .text(equipeLinhas,  COL.equipe,  yLinha, { width: larguraEquipe,  lineBreak: false })

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(statusCor)
        .text(statusText, COL.status, yLinha, { width: larguraStatus, lineBreak: false })

      // Obs convite (caso exista)
      if (r.observacaoConvite) {
        doc.moveDown(0.6)
        doc
          .fontSize(7)
          .font('Helvetica-Oblique')
          .fillColor('#777777')
          .text(`  "${r.observacaoConvite}"`, COL.contato, doc.y, { width: larguraUtil - (COL.contato - MARGEM) })
      }

      doc.moveDown(0.6)
      alternar = !alternar

      // Linha divisória leve
      doc
        .moveTo(MARGEM, doc.y - 1)
        .lineTo(MARGEM + larguraUtil, doc.y - 1)
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .stroke()
    }

    // ── Rodapé com número de página ──────────────────────────────────────────
    const totalPags = (doc as unknown as { bufferedPageRange(): { count: number } }).bufferedPageRange().count
    for (let i = 0; i < totalPags; i++) {
      doc.switchToPage(i)
      const yRodape = doc.page.height - MARGEM + 10
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#888888')
        .text(
          `Retiro de Jovens · Fiat  —  Página ${i + 1} de ${totalPags}`,
          MARGEM,
          yRodape,
          { width: larguraUtil, align: 'right' },
        )
    }

    doc.end()
  })
}
