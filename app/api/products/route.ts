import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getProductById, updateProduct } from '@/services/product.service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const product = await getProductById(params.id)
    if (!product) return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
    return NextResponse.json(product)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    // Никогда не обновляем currentStock напрямую через этот endpoint
    const { currentStock, ...safeData } = body
    const product = await updateProduct(params.id, safeData)
    return NextResponse.json(product)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
