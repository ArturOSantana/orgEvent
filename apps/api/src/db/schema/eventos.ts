import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios.js';

export const eventos = pgTable('eventos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 300 }).notNull(),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  descricao: text('descricao'),
  dataInicio: timestamp('data_inicio').notNull(),
  dataFim: timestamp('data_fim').notNull(),
  local: varchar('local', { length: 300 }),
  capacidade: integer('capacidade'),
  status: varchar('status', { length: 50 }).notNull().default('planejamento'),
  obs: text('obs'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const eventoUsuarios = pgTable(
  'evento_usuarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventoId: uuid('evento_id')
      .notNull()
      .references(() => eventos.id),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    perfil: varchar('perfil', { length: 50 }).notNull(),
    criadoEm: timestamp('criado_em').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('evento_usuarios_evento_usuario_idx').on(t.eventoId, t.usuarioId),
  ],
);

export type Evento = typeof eventos.$inferSelect;
export type NovoEvento = typeof eventos.$inferInsert;
export type EventoUsuario = typeof eventoUsuarios.$inferSelect;
export type NovoEventoUsuario = typeof eventoUsuarios.$inferInsert;
