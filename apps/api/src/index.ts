import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth.js'
import { eventosRoutes } from './routes/eventos.js'
import { cronogramaRoutes } from './routes/cronograma.js'
import { equipesRoutes } from './routes/equipes.js'
import { voluntariosRoutes } from './routes/voluntarios.js'
import { participantesRoutes } from './routes/participantes.js'
import { materiaisRoutes } from './routes/materiais.js'
import { exportarRoutes } from './routes/exportar.js'
import { syncRoutes } from './routes/sync.js'
import { perfilRoutes } from './routes/perfil.js'
import { convitesPublicosRoutes } from './routes/convites.js'
import { formularioRoutes, inscricaoPublicaRoutes } from './routes/inscricao.js'
import { quartosRoutes } from './routes/quartos.js'

export const app = Fastify({ logger: true })

// CORS — origens permitidas via variavel de ambiente (multiplas separadas por virgula)
const corsOrigins = process.env['CORS_ORIGIN']?.split(',').map((origin) => origin.trim()).filter(Boolean)
await app.register(cors, {
  origin: corsOrigins?.length ? corsOrigins : true,
  credentials: true,
})

// Rate limiting global moderado — 100 requisicoes por minuto por IP
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// Rota de verificacao de saude da API
app.get('/health', async (_request, _reply) => {
  return { status: 'ok' }
})

// Rotas de autenticacao
app.register(authRoutes, { prefix: '/auth' })

// Rotas de eventos
app.register(eventosRoutes, { prefix: '/api/eventos' })

// Rotas de cronograma (aninhadas em eventos)
app.register(cronogramaRoutes, { prefix: '/api/eventos/:eventoId/cronograma' })

// Rotas de equipes (aninhadas em eventos)
app.register(equipesRoutes, { prefix: '/api/eventos/:eventoId/equipes' })

// Rotas de voluntarios (aninhadas em eventos)
app.register(voluntariosRoutes, { prefix: '/api/eventos/:eventoId/voluntarios' })

// Rotas de participantes (aninhadas em eventos)
app.register(participantesRoutes, { prefix: '/api/eventos/:eventoId/participantes' })

// Rotas de quartos (aninhadas em eventos)
app.register(quartosRoutes, { prefix: '/api/eventos/:eventoId/quartos' })

// Rotas de materiais e observacoes (aninhadas em eventos)
app.register(materiaisRoutes, { prefix: '/api/eventos/:eventoId/materiais' })

// Rotas de exportacao PDF/Excel (aninhadas em eventos)
app.register(exportarRoutes, { prefix: '/api/eventos/:eventoId/exportar' })

// Rotas de perfil de usuario
app.register(perfilRoutes, { prefix: '/api/perfil' })

// Rota de sincronizacao offline
app.register(syncRoutes, { prefix: '/api' })

// Rotas publicas de convites (sem autenticacao — acesso pelo voluntario)
app.register(convitesPublicosRoutes, { prefix: '/api/convites' })

// Rotas de formulario de inscricao (admin) e inscricao publica
app.register(formularioRoutes)
app.register(inscricaoPublicaRoutes)

// O listener so e iniciado no desenvolvimento local. No Vercel, a funcao
// usa diretamente o servidor HTTP do Fastify.
if (process.env['VERCEL'] !== '1') {
  const PORT = parseInt(process.env['PORT'] ?? '3001', 10)
  app.listen({ port: PORT, host: '127.0.0.1' }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`Servidor iniciado em ${address}`)
  })
}
