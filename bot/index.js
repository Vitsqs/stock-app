require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Bot, InlineKeyboard } = require('grammy')

const token = process.env.TELEGRAM_BOT_TOKEN
const miniAppUrl = process.env.MINI_APP_URL

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан в .env')
  process.exit(1)
}
if (!miniAppUrl) {
  console.error('❌ MINI_APP_URL не задан в .env')
  process.exit(1)
}

const bot = new Bot(token)

// /start — главная точка входа
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'друг'
  const keyboard = new InlineKeyboard()
    .webApp('📦 Открыть учёт остатков', miniAppUrl)

  await ctx.reply(
    `Привет, ${name}! 👋\n\n` +
    `Это приложение для учёта остатков товара.\n\n` +
    `Нажми кнопку ниже, чтобы открыть приложение:`,
    { reply_markup: keyboard }
  )
})

// /help
bot.command('help', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('📦 Открыть учёт', miniAppUrl)
  await ctx.reply(
    '📋 Команды:\n/start — открыть приложение\n/help — справка',
    { reply_markup: keyboard }
  )
})

// Любое другое сообщение
bot.on('message', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('📦 Открыть учёт остатков', miniAppUrl)
  await ctx.reply('Нажми кнопку для открытия приложения:', { reply_markup: keyboard })
})

// Обработчик ошибок
bot.catch((err) => {
  console.error('Ошибка бота:', err.message)
})

bot.start()
console.log('✅ Telegram бот запущен!')
console.log(`📱 Mini App URL: ${miniAppUrl}`)
