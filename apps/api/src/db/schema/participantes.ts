import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { eventos } from './eventos.js';
import { equipes } from './equipes.js';
import { quartos } from './quartos.js';

export const participantes = pgTable('participantes', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  telefone: varchar('telefone', { length: 20 }),
  email: varchar('email', { length: 300 }),
  obs: text('obs'),
  status: varchar('status', { length: 50 }).notNull().default('confirmado'),
  equipeId: uuid('equipe_id').references(() => equipes.id),
  quartoId: uuid('quarto_id').references(() => quartos.id),
  inscricaoId: uuid('inscricao_id'),
  checkinEm: timestamp('checkin_em'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export type Participante = typeof participantes.$inferSelect;
export type NovoParticipante = typeof participantes.$inferInsert;
