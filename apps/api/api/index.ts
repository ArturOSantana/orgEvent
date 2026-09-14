import type { VercelRequest, VercelResponse } from '@vercel/node'
import { app } from '../src/index.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await app.ready()
  app.server.emit('request', request, response)
}
