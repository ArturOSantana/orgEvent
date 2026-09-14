import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';
import { eventos } from './eventos.js';

// ── Formulário de inscrição por evento ───────────────────────────────────────
export const formulariosInscricao = pgTable('formularios_inscricao', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventoId: uuid('evento_id')
    .notNull()
    .unique()
    .references(() => eventos.id),
  // Slug público para a URL de inscrição (ex: retiro-jovens-2025)
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descricao: text('descricao'),
  // Campos padrão habilitados
  coletarTelefone: boolean('coletar_telefone').notNull().default(true),
  coletarEmail: boolean('coletar_email').notNull().default(true),
  // Valor e pagamento
  valorInscricao: numeric('valor_inscricao', { precision: 10, scale: 2 }).default('0'),
  instrucoesPagamento: text('instrucoes_pagamento'),
  // Controle
  ativo: boolean('ativo').notNull().default(true),
  dataLimite: timestamp('data_limite'),
  vagas: integer('vagas'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

// ── Campos extras personalizados do formulário ────────────────────────────────
export const camposFormulario = pgTable('campos_formulario', {
  id: uuid('id').primaryKey().defaultRandom(),
  formularioId: uuid('formulario_id')
    .notNull()
    .references(() => formulariosInscricao.id),
  rotulo: varchar('rotulo', { length: 200 }).notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(), // 'texto' | 'textarea' | 'select' | 'checkbox'
  opcoes: jsonb('opcoes').$type<string[]>(), // para tipo 'select'
  obrigatorio: boolean('obrigatorio').notNull().default(false),
  ordem: integer('ordem').notNull().default(0),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});

// ── Inscrições submetidas pelo público ────────────────────────────────────────
export const inscricoes = pgTable('inscricoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  formularioId: uuid('formulario_id')
    .notNull()
    .references(() => formulariosInscricao.id),
  eventoId: uuid('evento_id')
    .notNull()
    .references(() => eventos.id),
  // Dados básicos do inscrito
  nome: varchar('nome', { length: 200 }).notNull(),
  email: varchar('email', { length: 300 }),
  telefone: varchar('telefone', { length: 20 }),
  // Status do fluxo: pendente_pagamento → pago → confirmado | cancelado
  status: varchar('status', { length: 50 }).notNull().default('pendente_pagamento'),
  // Quem confirmou o pagamento e quando
  pagamentoConfirmadoPor: uuid('pagamento_confirmado_por'),
  pagamentoConfirmadoEm: timestamp('pagamento_confirmado_em'),
  // Check-in no evento (feito pelo admin na chegada)
  checkinEm: timestamp('checkin_em'),
  checkinConfirmadoPor: uuid('checkin_confirmado_por'),
  // Observação interna do admin
  obsAdmin: text('obs_admin'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

// ── Respostas dos campos extras ───────────────────────────────────────────────
export const respostasInscricao = pgTable('respostas_inscricao', {
  id: uuid('id').primaryKey().defaultRandom(),
  inscricaoId: uuid('inscricao_id')
    .notNull()
    .references(() => inscricoes.id),
  campoId: uuid('campo_id')
    .notNull()
    .references(() => camposFormulario.id),
  valor: text('valor'),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});

export type FormularioInscricao = typeof formulariosInscricao.$inferSelect;
export type NovoFormularioInscricao = typeof formulariosInscricao.$inferInsert;
export type CampoFormulario = typeof camposFormulario.$inferSelect;
export type NovoCampoFormulario = typeof camposFormulario.$inferInsert;
export type Inscricao = typeof inscricoes.$inferSelect;
export type NovaInscricao = typeof inscricoes.$inferInsert;
export type RespostaInscricao = typeof respostasInscricao.$inferSelect;
