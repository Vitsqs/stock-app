// Запускает Next.js + Telegram бот одновременно
const { spawn, execSync } = require('child_process')
const path = require('path')

const ROOT = __dirname

function startBot() {
  const bot = spawn('node', [path.join(ROOT, 'bot/index.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: ROOT,
  })
  bot.on('close', (code) => {
    if (code !== 0) {
      console.error(`[BOT] Завершился с кодом ${code}, перезапуск через 5 сек...`)
      setTimeout(startBot, 5000)
    }
  })
}

console.log('🤖 Запуск Telegram бота...')
startBot()

console.log('🌐 Запуск Next.js...')
try {
  execSync('npm run start', { stdio: 'inherit', env: process.env, cwd: ROOT })
} catch (e) {
  console.error('Next.js упал:', e.message)
  process.exit(1)
}
