import { prisma } from '@/lib/prisma'

export async function findOrCreateUser(telegramUser: {
  id: number; first_name: string; last_name?: string
  username?: string; language_code?: string
}) {
  const telegramId = String(telegramUser.id)

  const existing = await prisma.user.findUnique({ where: { telegramId } })

  if (existing) {
    // Обновляем данные профиля при каждом входе
    return prisma.user.update({
      where: { telegramId },
      data: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name ?? null,
        username: telegramUser.username ?? null,
      },
    })
  }

  // Первый пользователь → ADMIN + активен сразу
  // Все остальные → WORKER + неактивны до одобрения ADMIN
  const usersCount = await prisma.user.count()
  const isFirst = usersCount === 0

  return prisma.user.create({
    data: {
      telegramId,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name ?? null,
      username: telegramUser.username ?? null,
      languageCode: telegramUser.language_code ?? null,
      role: isFirst ? 'ADMIN' : 'WORKER',
      isActive: isFirst,
    },
  })
}

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, telegramId: true, firstName: true,
      lastName: true, username: true, role: true,
      isActive: true, createdAt: true,
    },
  })
}

export async function setUserActive(userId: string, isActive: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { isActive } })
}

export async function setUserRole(userId: string, role: 'ADMIN' | 'WORKER') {
  return prisma.user.update({ where: { id: userId }, data: { role } })
}
