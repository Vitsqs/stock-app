// На Railway переменные берутся из Variables — dotenv не нужен
const { Bot, InlineKeyboard } = require('grammy')

const token = process.env.TELEGRAM_BOT_TOKEN
const miniAppUrl = process.env.MINI_APP_URL

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан')
  process.exit(1)
}
if (!miniAppUrl) {
  console.error('❌ MINI_APP_URL не задан')
  process.exit(1)
}

const bot = new Bot(token)

bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'друг'
  const keyboard = new InlineKeyboard()
    .webApp('📦 Открыть учёт остатков', miniAppUrl)
  await ctx.reply(
    `Привет, ${name}! 👋\n\nЭто приложение для учёта остатков товара.\n\nНажми кнопку ниже:`,
    { reply_markup: keyboard }
  )
})

bot.command('help', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('📦 Открыть учёт', miniAppUrl)
  await ctx.reply('Нажми кнопку чтобы открыть приложение:', { reply_markup: keyboard })
})

bot.on('message', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('📦 Открыть учёт остатков', miniAppUrl)
  await ctx.reply('Нажми кнопку для открытия приложения:', { reply_markup: keyboard })
})

bot.catch((err) => {
  console.error('Ошибка бота:', err.message)
})

bot.start()
console.log('✅ Бот запущен!')
console.log('📱 Mini App URL:', miniAppUrl)
