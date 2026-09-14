import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import * as schema from './schema/index.js'

const databaseUrl = process.env['DATABASE_URL']
if (!databaseUrl) {
  throw new Error('DATABASE_URL nao definida nas variaveis de ambiente')
}

// Uso: tsx src/db/update-admin-credentials.ts <email-antigo> <novo-email> <nova-senha>
const [emailAntigo, novoEmail, novaSenha] = process.argv.slice(2)
if (!emailAntigo || !novoEmail || !novaSenha) {
  console.error('Uso: tsx src/db/update-admin-credentials.ts <email-antigo> <novo-email> <nova-senha>')
  process.exit(1)
}

async function updateCredentials(): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })
  const db = drizzle(pool, { schema })

  const senhaHash = await bcrypt.hash(novaSenha, 12)

  const resultado = await db
    .update(schema.usuarios)
    .set({ email: novoEmail, senhaHash, atualizadoEm: new Date() })
    .where(eq(schema.usuarios.email, emailAntigo))
    .returning({ id: schema.usuarios.id, email: schema.usuarios.email })

  if (resultado.length === 0) {
    console.error(`Usuario ${emailAntigo} nao encontrado.`)
    process.exit(1)
  }

  console.log('Credenciais atualizadas com sucesso para:', resultado[0]?.email)
  await pool.end()
}

updateCredentials().catch((err: unknown) => {
  console.error('Erro:', err instanceof Error ? err.message : err)
  process.exit(1)
})
