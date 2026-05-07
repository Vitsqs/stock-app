import { prisma } from '@/lib/prisma'
import { StockMovementType } from '@prisma/client'

export class StockError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'StockError'
  }
}

export async function increaseStock({
  productId, quantity, userId, comment,
}: {
  productId: string; quantity: number; userId: string; comment?: string
}) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new StockError('Количество должно быть целым числом > 0', 'INVALID_QUANTITY')
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } })
    if (!product) throw new StockError('Товар не найден', 'NOT_FOUND')
    if (!product.isActive) throw new StockError('Товар неактивен', 'INACTIVE')

    const previousStock = product.currentStock
    const newStock = previousStock + quantity

    await tx.product.update({
      where: { id: productId },
      data: { currentStock: newStock },
    })

    const movement = await tx.stockMovement.create({
      data: {
        productId, type: StockMovementType.INCOME,
        quantity, previousStock, newStock,
        comment: comment?.trim() || null, userId,
      },
    })

    await tx.auditLog.create({
      data: {
        userId, action: 'INCREASE_STOCK', entityType: 'Product', entityId: productId,
        oldValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      },
    })

    return { movement, previousStock, newStock }
  })
}

export async function decreaseStock({
  productId, quantity, userId, comment,
}: {
  productId: string; quantity: number; userId: string; comment?: string
}) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new StockError('Количество должно быть целым числом > 0', 'INVALID_QUANTITY')
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } })
    if (!product) throw new StockError('Товар не найден', 'NOT_FOUND')
    if (!product.isActive) throw new StockError('Товар неактивен', 'INACTIVE')
    if (product.currentStock < quantity) {
      throw new StockError(
        `Недостаточно товара. На остатке: ${product.currentStock} ${product.unit}`,
        'INSUFFICIENT_STOCK'
      )
    }

    const previousStock = product.currentStock
    const newStock = previousStock - quantity

    // Двойная защита от гонки — WHERE гарантирует что никто не успел списать параллельно
    const updated = await tx.product.updateMany({
      where: { id: productId, currentStock: { gte: quantity } },
      data: { currentStock: newStock },
    })

    if (updated.count === 0) {
      throw new StockError(
        'Недостаточно товара (конкурентное изменение)',
        'INSUFFICIENT_STOCK'
      )
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId, type: StockMovementType.OUTCOME,
        quantity, previousStock, newStock,
        comment: comment?.trim() || null, userId,
      },
    })

    await tx.auditLog.create({
      data: {
        userId, action: 'DECREASE_STOCK', entityType: 'Product', entityId: productId,
        oldValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      },
    })

    return { movement, previousStock, newStock }
  })
}

export async function adjustStock({
  productId, newStock, userId, comment,
}: {
  productId: string; newStock: number; userId: string; comment?: string
}) {
  if (!Number.isInteger(newStock) || newStock < 0) {
    throw new StockError('Новый остаток должен быть целым числом ≥ 0', 'INVALID_STOCK')
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } })
    if (!product) throw new StockError('Товар не найден', 'NOT_FOUND')

    const previousStock = product.currentStock
    const quantity = Math.abs(newStock - previousStock)

    await tx.product.update({
      where: { id: productId },
      data: { currentStock: newStock },
    })

    const movement = await tx.stockMovement.create({
      data: {
        productId, type: StockMovementType.ADJUSTMENT,
        quantity, previousStock, newStock,
        comment: comment?.trim() || null, userId,
      },
    })

    await tx.auditLog.create({
      data: {
        userId, action: 'ADJUST_STOCK', entityType: 'Product', entityId: productId,
        oldValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      },
    })

    return { movement, previousStock, newStock }
  })
}
