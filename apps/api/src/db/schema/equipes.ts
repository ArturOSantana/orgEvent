import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { eventos } from './eventos.js';

export const equipes = pgTable('equipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const funcoes = pgTable('funcoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const voluntarios = pgTable(
  'voluntarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventoId: uuid('evento_id').references(() => eventos.id),
    nome: varchar('nome', { length: 200 }).notNull(),
    telefone: varchar('telefone', { length: 20 }),
    email: varchar('email', { length: 300 }),
    obs: text('obs'),
    // Campos do sistema de convites
    slug: varchar('slug', { length: 300 }).unique(),
    statusConvite: varchar('status_convite', { length: 50 }).default('pendente'),
    observacaoConvite: text('observacao_convite').default(''),
    dataResposta: timestamp('data_resposta'),
    visualizadoEm: timestamp('visualizado_em'),
    tituloConvite: text('titulo_convite'),
    mensagemConvite: text('mensagem_convite'),
    arteUrl: text('arte_url'),
    criadoEm: timestamp('criado_em').defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('voluntarios_slug_idx').on(t.slug),
    index('voluntarios_evento_id_idx').on(t.eventoId),
  ],
);

export const equipeVoluntarios = pgTable(
  'equipe_voluntarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    equipeId: uuid('equipe_id')
      .notNull()
      .references(() => equipes.id),
    voluntarioId: uuid('voluntario_id')
      .notNull()
      .references(() => voluntarios.id),
    funcaoId: uuid('funcao_id').references(() => funcoes.id),
    criadoEm: timestamp('criado_em').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('equipe_voluntarios_equipe_voluntario_idx').on(
      t.equipeId,
      t.voluntarioId,
    ),
  ],
);

export type Equipe = typeof equipes.$inferSelect;
export type NovaEquipe = typeof equipes.$inferInsert;
export type Funcao = typeof funcoes.$inferSelect;
export type NovaFuncao = typeof funcoes.$inferInsert;
export type Voluntario = typeof voluntarios.$inferSelect;
export type NovoVoluntario = typeof voluntarios.$inferInsert;
export type EquipeVoluntario = typeof equipeVoluntarios.$inferSelect;
export type NovoEquipeVoluntario = typeof equipeVoluntarios.$inferInsert;
