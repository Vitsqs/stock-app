const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Запуск seed...')

  // Проверяем — если товары уже есть, не пересоздаём
  const existing = await prisma.product.count()
  if (existing > 0) {
    console.log(`✅ База уже содержит ${existing} товаров, seed пропускается.`)
    return
  }

  // Создаём admin пользователя (только если нет пользователей)
  const usersExist = await prisma.user.count()
  let admin

  if (usersExist === 0) {
    admin = await prisma.user.create({
      data: {
        telegramId: '000000000',
        firstName: 'System',
        username: 'system_seed',
        role: 'ADMIN',
        isActive: true,
      },
    })
    console.log('👤 Системный пользователь создан')
  } else {
    admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  }

  const products = [
    { sku: 'CRM-001', name: 'Крем увлажняющий',               volume: '50 мл',  unit: 'шт', stock: 45, min: 10 },
    { sku: 'CRM-002', name: 'Крем увлажняющий',               volume: '100 мл', unit: 'шт', stock: 30, min: 5  },
    { sku: 'CRM-003', name: 'Крем для чувствительной кожи',   volume: '50 мл',  unit: 'шт', stock: 20, min: 5  },
    { sku: 'BLM-001', name: 'Восстанавливающий бальзам',      volume: '40 мл',  unit: 'шт', stock: 15, min: 5  },
    { sku: 'GEL-001', name: 'Очищающий гель',                 volume: '200 мл', unit: 'шт', stock: 50, min: 10 },
    { sku: 'SUN-001', name: 'Солнцезащитный крем SPF 50',     volume: '50 мл',  unit: 'шт', stock: 25, min: 5  },
    { sku: 'SRM-001', name: 'Сыворотка увлажняющая',          volume: '30 мл',  unit: 'шт', stock: 0,  min: 3  },
    { sku: 'LOS-001', name: 'Лосьон для лица',                volume: '150 мл', unit: 'шт', stock: 35, min: 5  },
    { sku: 'FOM-001', name: 'Пенка для умывания',             volume: '150 мл', unit: 'шт', stock: 40, min: 8  },
    { sku: 'MSK-001', name: 'Маска восстанавливающая',        volume: '75 мл',  unit: 'шт', stock: 0,  min: 3  },
  ]

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        volume: p.volume,
        unit: p.unit,
        currentStock: p.stock,
        minStock: p.min,
        isActive: true,
      },
    })

    if (p.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: p.stock,
          previousStock: 0,
          newStock: p.stock,
          comment: 'Начальный остаток',
          userId: admin.id,
        },
      })
    }

    console.log(`  📦 ${p.name} (${p.volume}) — ${p.stock} шт`)
  }

  console.log('✅ Seed завершён! 10 товаров создано.')
}

main()
  .catch(e => { console.error('❌ Ошибка seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
