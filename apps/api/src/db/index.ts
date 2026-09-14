import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL nao definida nas variaveis de ambiente');
}

// SSL obrigatorio para Supabase; rejectUnauthorized false aceita o certificado deles.
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
export type Db = typeof db;
