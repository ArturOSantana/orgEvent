import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import * as schema from './schema/index.js';

const BCRYPT_ROUNDS = 12;

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL nao definida nas variaveis de ambiente');
}

async function seed(): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool, { schema });

  // --- Usuario admin ---
  const emailAdmin = 'admin@retiro.local';
  const [usuarioExistente] = await db
    .select({ id: schema.usuarios.id })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.email, emailAdmin))
    .limit(1);

  let adminId: string;
  if (usuarioExistente) {
    adminId = usuarioExistente.id;
    console.log('Usuario admin ja existe, pulando criacao.');
  } else {
    const senhaHash = await bcrypt.hash('Admin@2024', BCRYPT_ROUNDS);
    const [admin] = await db
      .insert(schema.usuarios)
      .values({
        nome: 'Admin Retiro',
        email: emailAdmin,
        senhaHash,
      })
      .returning({ id: schema.usuarios.id });
    adminId = admin!.id;
    console.log('Usuario admin criado:', adminId);
  }

  // --- Evento ---
  const nomeEvento = 'Retiro Jovens 2025';
  const [eventoExistente] = await db
    .select({ id: schema.eventos.id })
    .from(schema.eventos)
    .where(eq(schema.eventos.nome, nomeEvento))
    .limit(1);

  if (eventoExistente) {
    console.log('Evento ja existe, pulando criacao.');
  } else {
    const dataInicio = new Date('2025-10-03T14:00:00');
    const dataFim = new Date('2025-10-05T17:00:00');
    const [evento] = await db
      .insert(schema.eventos)
      .values({
        nome: nomeEvento,
        tipo: 'retiro',
        descricao: 'Retiro anual dos jovens',
        dataInicio,
        dataFim,
        status: 'planejamento',
      })
      .returning({ id: schema.eventos.id });
    const eventoId = evento!.id;
    console.log('Evento criado:', eventoId);

    // Vínculo admin <-> evento
    await db.insert(schema.eventoUsuarios).values({
      eventoId,
      usuarioId: adminId,
      perfil: 'coordenador',
    });
    console.log('EventoUsuario criado.');

    // --- Fases ---
    const [fase1] = await db
      .insert(schema.fases)
      .values({ eventoId, nome: 'Chegada e Abertura', ordem: 1 })
      .returning({ id: schema.fases.id });
    const [fase2] = await db
      .insert(schema.fases)
      .values({ eventoId, nome: 'Programacao Principal', ordem: 2 })
      .returning({ id: schema.fases.id });
    console.log('Fases criadas:', fase1!.id, fase2!.id);

    // --- Horarios na fase 1 ---
    await db.insert(schema.horarios).values([
      {
        eventoId,
        faseId: fase1!.id,
        titulo: 'Recepcao e Credenciamento',
        data: '2025-10-03',
        horaInicio: '14:00',
        horaFim: '15:30',
        local: 'Entrada principal',
        ordem: 1,
      },
      {
        eventoId,
        faseId: fase1!.id,
        titulo: 'Culto de Abertura',
        data: '2025-10-03',
        horaInicio: '16:00',
        horaFim: '17:30',
        local: 'Auditorio',
        ordem: 2,
      },
    ]);
    console.log('Horarios criados.');

    // --- Equipe e funcao ---
    const [equipe] = await db
      .insert(schema.equipes)
      .values({ eventoId, nome: 'Recepcao' })
      .returning({ id: schema.equipes.id });
    await db
      .insert(schema.funcoes)
      .values({ eventoId, nome: 'Recepcionista' });
    console.log('Equipe e funcao criadas:', equipe!.id);
  }

  console.log('Seed concluido.');
  await pool.end();
}

seed().catch((err: unknown) => {
  console.error('Erro no seed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
