import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Para migracoes usa DATABASE_URL_DIRECT (conexao direta, porta 5432)
// Se nao existir, cai para DATABASE_URL como fallback.
const databaseUrl = process.env['DATABASE_URL_DIRECT'] ?? process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL nao definida nas variaveis de ambiente');
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Aplica o SQL diretamente sem usar o migrador do Drizzle,
// que tenta criar schemas sem permissao no Supabase.
async function runMigrations(): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  const sqlPath = join(__dirname, 'migrations', 'supabase_run_once.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('Executando migracoes...');

  // Executar cada statement separadamente (separados por ponto-e-virgula)
  const db = drizzle(pool);
  const client = await pool.connect();
  try {
    // Remover comentarios de linha e dividir por ;
    const statements = sql
      .split('\n')
      .filter(line => !line.trimStart().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let aplicados = 0;
    for (const statement of statements) {
      try {
        await client.query(statement);
        aplicados++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Ignorar erros de objetos ja existentes (idempotencia)
        if (
          msg.includes('already exists') ||
          msg.includes('duplicate key') ||
          msg.includes('already exists')
        ) {
          continue;
        }
        throw err;
      }
    }
    console.log(`Migracoes concluidas. ${aplicados} statements executados.`);
  } finally {
    client.release();
    await pool.end();
  }

  void db; // evitar warning de variavel nao usada
}

runMigrations().catch((err: unknown) => {
  console.error('Erro ao executar migracoes:', err instanceof Error ? err.message : err);
  process.exit(1);
});
