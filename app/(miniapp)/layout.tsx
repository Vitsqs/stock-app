'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/layout/BottomNav'

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      if (tg.themeParams) {
        const r = document.documentElement
        const p = tg.themeParams
        if (p.bg_color)           r.style.setProperty('--tg-bg', p.bg_color)
        if (p.secondary_bg_color) r.style.setProperty('--tg-secondary', p.secondary_bg_color)
        if (p.text_color)         r.style.setProperty('--tg-text', p.text_color)
        if (p.hint_color)         r.style.setProperty('--tg-hint', p.hint_color)
        if (p.button_color)       r.style.setProperty('--tg-btn', p.button_color)
        if (p.button_text_color)  r.style.setProperty('--tg-btn-text', p.button_text_color)
        // Карточки берём из bg темы
        if (p.bg_color)           r.style.setProperty('--card-bg', p.bg_color)
      }
    }

    async function auth() {
      // ── 1. Есть кэшированная сессия — проверяем её ──
      const cached = localStorage.getItem('user')
      const sessionOk = sessionStorage.getItem('auth_ok')

      if (cached && sessionOk) {
        // Уже авторизовались в этой сессии — показываем сразу
        setStatus('ok')
        // Фоново обновляем на свежие данные
        doAuth(tg, false)
        return
      }

      // ── 2. Нет кэша — полная авторизация ──
      await doAuth(tg, true)
    }

    async function doAuth(tg: any, showLoading: boolean) {
      const initData = tg?.initData || ''
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ initData: initData || 'dev' }),
        })
        const data = await res.json()

        if (res.ok) {
          localStorage.setItem('user', JSON.stringify(data.user))
          sessionStorage.setItem('auth_ok', '1')
          if (showLoading) setStatus('ok')
        } else {
          if (showLoading) {
            setErrorMsg(data.error || 'Ошибка авторизации')
            setStatus('error')
          }
        }
      } catch {
        if (showLoading) {
          setErrorMsg('Нет соединения с сервером')
          setStatus('error')
        }
      }
    }

    auth()
  }, [])

  if (status === 'loading') {
    return (
      <div className="splash">
        <div style={{ fontSize: 48 }}>📦</div>
        <div className="spinner" />
        <p style={{ color: 'var(--tg-hint)', fontSize: 14 }}>Загрузка...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="splash" style={{ gap: 16, padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>🔒</div>
        <p style={{ fontWeight: 600, fontSize: 17 }}>{errorMsg}</p>
        <p style={{ color: 'var(--tg-hint)', fontSize: 14 }}>
          Обратитесь к администратору
        </p>
        <button
          className="btn btn-primary"
          style={{ padding: '14px 32px', marginTop: 8 }}
          onClick={() => {
            sessionStorage.removeItem('auth_ok')
            window.location.reload()
          }}
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tg-secondary)' }}>
      <main style={{ paddingBottom: 80 }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
