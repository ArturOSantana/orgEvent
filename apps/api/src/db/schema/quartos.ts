import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { eventos } from './eventos.js';

export const quartos = pgTable('quartos', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  nome: varchar('nome', { length: 200 }).notNull(), // ex: "Quarto 1 - Ala Masculina", "Chalé A"
  genero: varchar('genero', { length: 20 }).default('misto'), // 'masculino' | 'feminino' | 'misto'
  capacidade: integer('capacidade').notNull().default(4),
  responsavelNome: varchar('responsavel_nome', { length: 200 }),
  localizacao: varchar('localizacao', { length: 200 }), // ex: "Piso 2", "Ala Norte"
  obs: text('obs'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export type Quarto = typeof quartos.$inferSelect;
export type NovoQuarto = typeof quartos.$inferInsert;
