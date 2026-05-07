import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDashboardStats } from '@/services/product.service'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
