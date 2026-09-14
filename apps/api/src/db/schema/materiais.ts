import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
} from 'drizzle-orm/pg-core';
import { eventos } from './eventos.js';
import { usuarios } from './usuarios.js';

export const materiais = pgTable('materiais', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  quantidade: numeric('quantidade', { precision: 10, scale: 2 }).notNull().default('1'),
  unidade: varchar('unidade', { length: 50 }),
  responsavelId: uuid('responsavel_id').references(() => usuarios.id),
  status: varchar('status', { length: 50 }).notNull().default('pendente'),
  obs: text('obs'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const observacoes = pgTable('observacoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  conteudo: text('conteudo').notNull(),
  autorId: uuid('autor_id')
    .notNull()
    .references(() => usuarios.id),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export type Material = typeof materiais.$inferSelect;
export type NovoMaterial = typeof materiais.$inferInsert;
export type Observacao = typeof observacoes.$inferSelect;
export type NovaObservacao = typeof observacoes.$inferInsert;
