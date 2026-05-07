import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/lib/i18n-context'

export const metadata: Metadata = {
  title: 'Stock App — Учет остатков',
  description: 'Telegram Mini App для учета остатков товара',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        {/* Telegram WebApp SDK — обязательно до загрузки страницы */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  )
}
