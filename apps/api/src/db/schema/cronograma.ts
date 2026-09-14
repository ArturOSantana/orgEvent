import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  date,
} from 'drizzle-orm/pg-core';
import { eventos } from './eventos.js';
import { usuarios } from './usuarios.js';

export const fases = pgTable('fases', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  ordem: integer('ordem').notNull().default(0),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const horarios = pgTable('horarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  faseId: uuid('fase_id').references(() => fases.id),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descricao: text('descricao'),
  data: date('data').notNull(),
  horaInicio: varchar('hora_inicio', { length: 5 }).notNull(),
  horaFim: varchar('hora_fim', { length: 5 }).notNull(),
  local: varchar('local', { length: 200 }),
  responsavelId: uuid('responsavel_id').references(() => usuarios.id),
  ordem: integer('ordem').notNull().default(0),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export type Fase = typeof fases.$inferSelect;
export type NovaFase = typeof fases.$inferInsert;
export type Horario = typeof horarios.$inferSelect;
export type NovoHorario = typeof horarios.$inferInsert;
