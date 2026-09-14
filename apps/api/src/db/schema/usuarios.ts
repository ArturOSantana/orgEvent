import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 200 }).notNull(),
  email: varchar('email', { length: 300 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 500 }).notNull(),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    token: varchar('token', { length: 500 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    revogado: boolean('revogado').default(false),
    criadoEm: timestamp('criado_em').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('refresh_tokens_token_idx').on(t.token)],
);

export type Usuario = typeof usuarios.$inferSelect;
export type NovoUsuario = typeof usuarios.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NovoRefreshToken = typeof refreshTokens.$inferInsert;
