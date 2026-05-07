import { prisma } from '@/lib/prisma'
import { StockError } from './stock.service'

export async function createProduct({
  name, sku, unit, volume, barcode, description, imageUrl,
  minStock = 0, initialStock = 0, userId,
}: {
  name: string; sku: string; unit: string; volume?: string; barcode?: string
  description?: string; imageUrl?: string; minStock?: number; initialStock?: number; userId: string
}) {
  const existing = await prisma.product.findUnique({ where: { sku } })
  if (existing) throw new StockError(`Артикул "${sku}" уже существует`, 'SKU_DUPLICATE')

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim(),
        unit: unit.trim(),
        volume: volume?.trim() || null,
        barcode: barcode?.trim() || null,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        minStock,
        currentStock: initialStock,
        isActive: true,
      },
    })

    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          comment: 'Начальный остаток',
          userId,
        },
      })
    }

    return product
  })
}

export async function getProducts({
  search,
  includeInactive = false,
}: {
  search?: string
  includeInactive?: boolean
} = {}) {
  return prisma.product.findMany({
    where: {
      isActive: includeInactive ? undefined : true,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { volume: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          user: { select: { firstName: true, username: true } },
        },
      },
    },
  })
}

export async function updateProduct(id: string, data: {
  name?: string; volume?: string; unit?: string; barcode?: string
  description?: string; imageUrl?: string; minStock?: number; isActive?: boolean
}) {
  return prisma.product.update({ where: { id }, data })
}

export async function getDashboardStats() {
  const [products, zeroCount, recentMovements] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true },
    }),
    prisma.product.count({
      where: { isActive: true, currentStock: 0 },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { firstName: true, username: true } },
      },
    }),
  ])

  return {
    totalProducts: products.length,
    totalUnits: products.reduce((sum, p) => sum + p.currentStock, 0),
    zeroStockCount: zeroCount,
    recentMovements,
  }
}

export async function getStockMovements({
  productId,
  type,
  page = 1,
  limit = 30,
}: {
  productId?: string; type?: string; page?: number; limit?: number
} = {}) {
  const where: any = {}
  if (productId) where.productId = productId
  if (type) where.type = type

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { firstName: true, username: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ])

  return { movements, total, page, limit }
}
