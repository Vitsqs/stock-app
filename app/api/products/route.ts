import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getProducts, createProduct } from '@/services/product.service'
import { StockError } from '@/services/stock.service'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search') ?? undefined
  const includeInactive = req.nextUrl.searchParams.get('all') === '1' && session.role === 'ADMIN'

  try {
    const products = await getProducts({ search, includeInactive })
    return NextResponse.json(products)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Только администратор может добавлять товары' }, { status: 403 })
  }

  try {
    const body = await req.json()

    if (!body.name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
    if (!body.sku?.trim()) return NextResponse.json({ error: 'Артикул обязателен' }, { status: 400 })
    if (!body.unit?.trim()) return NextResponse.json({ error: 'Единица измерения обязательна' }, { status: 400 })

    const initialStock = Number(body.initialStock ?? 0)
    const minStock = Number(body.minStock ?? 0)

    if (isNaN(initialStock) || initialStock < 0) {
      return NextResponse.json({ error: 'Начальный остаток должен быть ≥ 0' }, { status: 400 })
    }
    if (isNaN(minStock) || minStock < 0) {
      return NextResponse.json({ error: 'Минимальный остаток должен быть ≥ 0' }, { status: 400 })
    }

    const product = await createProduct({
      name: body.name.trim(),
      sku: body.sku.trim(),
      unit: body.unit.trim(),
      volume: body.volume?.trim() || undefined,
      barcode: body.barcode?.trim() || undefined,
      description: body.description?.trim() || undefined,
      imageUrl: body.imageUrl?.trim() || undefined,
      minStock,
      initialStock,
      userId: session.userId,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (e: any) {
    if (e instanceof StockError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
