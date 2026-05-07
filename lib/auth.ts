import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production-32chars!!'
  )

export interface SessionPayload {
  userId: string
  telegramId: string
  role: string
  isActive: boolean
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null
    return await verifySession(token)
  } catch {
    return null
  }
}
