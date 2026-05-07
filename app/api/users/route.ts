import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUsers, setUserActive, setUserRole } from '@/services/user.service'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { userId, isActive, role } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId обязателен' }, { status: 400 })

    // Нельзя изменить себя
    if (userId === session.userId) {
      return NextResponse.json({ error: 'Нельзя изменить свой собственный аккаунт' }, { status: 400 })
    }

    if (isActive !== undefined) await setUserActive(userId, Boolean(isActive))
    if (role !== undefined) {
      if (role !== 'ADMIN' && role !== 'WORKER') {
        return NextResponse.json({ error: 'Роль должна быть ADMIN или WORKER' }, { status: 400 })
      }
      await setUserRole(userId, role)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
