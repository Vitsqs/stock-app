import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getStockMovements } from '@/services/product.service'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const productId = req.nextUrl.searchParams.get('productId') ?? undefined
  const type = req.nextUrl.searchParams.get('type') ?? undefined
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1))

  try {
    const data = await getStockMovements({ productId, type, page })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
