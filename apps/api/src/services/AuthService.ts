import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { usuarios, refreshTokens } from '../db/schema/index.js'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variavel de ambiente ${key} nao definida`)
  return value
}

export interface UsuarioPublico {
  id: string
  nome: string
  email: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  usuario: UsuarioPublico
}

export class AuthService {
  async registrar(nome: string, email: string, senha: string): Promise<LoginResult> {
    const emailSanitizado = email.trim().toLowerCase()
    const nomeSanitizado = nome.trim()

    // Verifica se ja existe usuario com este email
    const [existente] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, emailSanitizado))
      .limit(1)

    if (existente) {
      throw new Error('EMAIL_JA_CADASTRADO')
    }

    // Hash da senha com bcrypt (12 rounds)
    const senhaHash = await bcrypt.hash(senha, 12)

    const [novoUsuario] = await db
      .insert(usuarios)
      .values({
        nome: nomeSanitizado,
        email: emailSanitizado,
        senhaHash,
      })
      .returning({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
      })

    const jwtSecret = getEnv('JWT_SECRET')
    const jwtRefreshSecret = getEnv('JWT_REFRESH_SECRET')

    const accessToken = jwt.sign(
      { sub: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    )

    const refreshToken = jwt.sign(
      { sub: novoUsuario.id, tipo: 'refresh' },
      jwtRefreshSecret,
      { algorithm: 'HS256', expiresIn: '7d' },
    )

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.insert(refreshTokens).values({
      usuarioId: novoUsuario.id,
      token: refreshToken,
      expiresAt,
      revogado: false,
    })

    return {
      accessToken,
      refreshToken,
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email },
    }
  }

  async login(email: string, senha: string): Promise<LoginResult> {
    // Busca usuario pelo email
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1)

    // Verifica senha — bcrypt.compare e timing-safe
    // Se usuario nao existe, compara com hash dummy para evitar timing attack
    const hashParaComparar =
      usuario?.senhaHash ??
      '$2b$12$invalidhashplaceholdertoavoidtimingattack000000000000000'

    const senhaValida = await bcrypt.compare(senha, hashParaComparar)

    // Mensagem generica — nunca diferenciar email inexistente de senha errada
    if (!usuario || !senhaValida) {
      throw new Error('CREDENCIAIS_INVALIDAS')
    }

    const jwtSecret = getEnv('JWT_SECRET')
    const jwtRefreshSecret = getEnv('JWT_REFRESH_SECRET')

    // Access token: 15 minutos
    const accessToken = jwt.sign(
      { sub: usuario.id, nome: usuario.nome, email: usuario.email },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    )

    // Refresh token: 7 dias
    const refreshToken = jwt.sign(
      { sub: usuario.id, tipo: 'refresh' },
      jwtRefreshSecret,
      { algorithm: 'HS256', expiresIn: '7d' },
    )

    // Persiste refresh token na tabela
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.insert(refreshTokens).values({
      usuarioId: usuario.id,
      token: refreshToken,
      expiresAt,
      revogado: false,
    })

    return {
      accessToken,
      refreshToken,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    }
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    // Verifica existencia, revogacao e expiracao na tabela
    const [registro] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.revogado, false),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1)

    if (!registro) throw new Error('TOKEN_INVALIDO')

    // Verifica assinatura JWT
    const jwtRefreshSecret = getEnv('JWT_REFRESH_SECRET')
    const payload = jwt.verify(refreshToken, jwtRefreshSecret) as jwt.JwtPayload
    if (!payload.sub) throw new Error('TOKEN_INVALIDO')

    // Busca dados atuais do usuario
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, payload.sub as string))
      .limit(1)

    if (!usuario) throw new Error('TOKEN_INVALIDO')

    const jwtSecret = getEnv('JWT_SECRET')
    const accessToken = jwt.sign(
      { sub: usuario.id, nome: usuario.nome, email: usuario.email },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    )

    return { accessToken }
  }

  async logout(refreshToken: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revogado: true })
      .where(eq(refreshTokens.token, refreshToken))
  }
}

export const authService = new AuthService()
