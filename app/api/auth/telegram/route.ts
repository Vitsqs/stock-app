import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramInitData } from '@/lib/telegram'
import { findOrCreateUser } from '@/services/user.service'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { initData } = body

    if (!initData) {
      return NextResponse.json({ error: 'initData обязателен' }, { status: 400 })
    }

    const telegramUser = verifyTelegramInitData(initData)
    if (!telegramUser) {
      return NextResponse.json({ error: 'Неверная подпись Telegram. Откройте приложение через бота.' }, { status: 401 })
    }

    const user = await findOrCreateUser(telegramUser)

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Аккаунт не активирован. Обратитесь к администратору.' },
        { status: 403 }
      )
    }

    const token = await createSession({
      userId: user.id,
      telegramId: user.telegramId,
      role: user.role,
      isActive: user.isActive,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        role: user.role,
      }
    })

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    return response
  } catch (e: any) {
    console.error('[AUTH ERROR]', e.message)
    return NextResponse.json({ error: 'Ошибка сервера: ' + e.message }, { status: 500 })
  }
}
