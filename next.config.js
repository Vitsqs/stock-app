/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем строгий режим для совместимости с Telegram WebApp
  reactStrictMode: false,
  // Разрешаем внешние скрипты Telegram
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://web.telegram.org https://t.me" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
