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

// Senha nova passada como argumento: tsx reset-admin-password.ts <nova-senha>
const novaSenha = process.argv[2]
if (!novaSenha) {
  console.error('Uso: tsx src/db/reset-admin-password.ts <nova-senha>')
  process.exit(1)
}

async function resetPassword(): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })
  const db = drizzle(pool, { schema })

  const senhaHash = await bcrypt.hash(novaSenha, 12)

  const resultado = await db
    .update(schema.usuarios)
    .set({ senhaHash, atualizadoEm: new Date() })
    .where(eq(schema.usuarios.email, 'admin@retiro.local'))
    .returning({ id: schema.usuarios.id, email: schema.usuarios.email })

  if (resultado.length === 0) {
    console.error('Usuario admin@retiro.local nao encontrado.')
    process.exit(1)
  }

  console.log('Senha atualizada com sucesso para:', resultado[0]?.email)
  await pool.end()
}

resetPassword().catch((err: unknown) => {
  console.error('Erro:', err instanceof Error ? err.message : err)
  process.exit(1)
})
