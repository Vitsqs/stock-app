import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { increaseStock, decreaseStock, adjustStock, StockError } from '@/services/stock.service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { operation, productId, quantity, newStock, comment } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId обязателен' }, { status: 400 })
    }

    let result

    if (operation === 'income') {
      const q = Number(quantity)
      if (!q || q <= 0) return NextResponse.json({ error: 'Количество должно быть > 0' }, { status: 400 })
      result = await increaseStock({ productId, quantity: q, userId: session.userId, comment })

    } else if (operation === 'outcome') {
      const q = Number(quantity)
      if (!q || q <= 0) return NextResponse.json({ error: 'Количество должно быть > 0' }, { status: 400 })
      result = await decreaseStock({ productId, quantity: q, userId: session.userId, comment })

    } else if (operation === 'adjustment') {
      const ns = Number(newStock)
      if (isNaN(ns) || ns < 0) return NextResponse.json({ error: 'Новый остаток должен быть ≥ 0' }, { status: 400 })
      result = await adjustStock({ productId, newStock: ns, userId: session.userId, comment })

    } else {
      return NextResponse.json({ error: 'Неверная операция. Допустимо: income, outcome, adjustment' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (e: any) {
    if (e instanceof StockError) {
      const status = e.code === 'INSUFFICIENT_STOCK' ? 422 : 400
      return NextResponse.json({ error: e.message, code: e.code }, { status })
    }
    console.error('[STOCK ERROR]', e.message)
    return NextResponse.json({ error: 'Ошибка сервера: ' + e.message }, { status: 500 })
  }
}
