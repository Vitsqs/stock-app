'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n-context'
import type { Locale } from '@/lib/i18n'

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale()
  const [user, setUser]         = useState<any>(null)
  const [users, setUsers]       = useState<any[]>([])
  const [loadingU, setLoadingU] = useState(false)
  const [savingId, setSavingId] = useState<string|null>(null)
  const [toast, setToast]       = useState('')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
  }, [])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setLoadingU(true)
      fetch('/api/users', { credentials: 'include' })
        .then(r => r.json())
        .then(d => { setUsers(Array.isArray(d) ? d : []); setLoadingU(false) })
        .catch(() => setLoadingU(false))
    }
  }, [user])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const toggleActive = async (u: any) => {
    setSavingId(u.id)
    await fetch('/api/users', { method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: u.id, isActive: !u.isActive }) })
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x))
    setSavingId(null)
    showToast(u.isActive ? '🔒 Пользователь деактивирован' : '✅ Пользователь активирован')
  }

  const toggleRole = async (u: any) => {
    const role = u.role === 'ADMIN' ? 'WORKER' : 'ADMIN'
    setSavingId(u.id)
    await fetch('/api/users', { method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: u.id, role }) })
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x))
    setSavingId(null)
    showToast(`Роль изменена на ${role === 'ADMIN' ? 'Администратор' : 'Сотрудник'}`)
  }

  return (
    <div style={{ padding: '16px 16px 8px' }}>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 18 }}>
        {t('settings')}
      </h1>

      {/* Language */}
      <div className="card animate-fade-in" style={{ padding: 16, marginBottom: 12 }}>
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>🌐 {t('language')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['ru','ro'] as Locale[]).map(lang => (
            <button
              key={lang}
              className="btn"
              onClick={() => setLocale(lang)}
              style={{
                padding: '13px',
                background: locale === lang ? 'var(--blue)' : 'var(--tg-secondary)',
                color: locale === lang ? '#fff' : 'var(--tg-text)',
                fontSize: 14,
                boxShadow: locale === lang ? '0 4px 14px rgba(0,122,255,0.35)' : 'none',
                transform: locale === lang ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.18s ease',
              }}
            >
              {lang === 'ru' ? '🇷🇺 Русский' : '🇷🇴 Română'}
            </button>
          ))}
        </div>
      </div>

      {/* Current user */}
      {user && (
        <div className="card animate-fade-in delay-1" style={{ padding: 16, marginBottom: 12 }}>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            👤 {user.firstName || user.username || 'Пользователь'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--tg-hint)' }}>{t('role')}</span>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-blue' : 'badge-green'}`}>
                {user.role === 'ADMIN' ? '👑 ' + t('admin') : '👷 ' + t('worker')}
              </span>
            </div>
            {user.username && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--tg-hint)' }}>Username</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>@{user.username}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users — admin only */}
      {user?.role === 'ADMIN' && (
        <div className="card animate-fade-in delay-2" style={{ padding: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>👥 {t('users')}</p>

          {loadingU && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <div className="spinner" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{
                border: '1px solid var(--card-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: u.id !== user.id ? 10 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {u.firstName || u.username || `ID: ${u.telegramId}`}
                    </div>
                    {u.username && <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>@{u.username}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-blue' : ''}`}
                      style={{ background: u.role !== 'ADMIN' ? 'var(--tg-secondary)' : undefined,
                               color: u.role !== 'ADMIN' ? 'var(--tg-hint)' : undefined }}>
                      {u.role === 'ADMIN' ? '👑 Admin' : '👷 Worker'}
                    </span>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? '● Активен' : '● Неактивен'}
                    </span>
                  </div>
                </div>

                {u.id !== user.id && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      className="btn"
                      onClick={() => toggleActive(u)}
                      disabled={savingId === u.id}
                      style={{
                        padding: '9px', fontSize: 12,
                        background: u.isActive ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.12)',
                        color: u.isActive ? 'var(--red)' : 'var(--green)',
                        opacity: savingId === u.id ? 0.5 : 1,
                      }}
                    >
                      {savingId === u.id ? '...' : u.isActive ? '🔒 Деактивировать' : '✅ Активировать'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => toggleRole(u)}
                      disabled={savingId === u.id}
                      style={{
                        padding: '9px', fontSize: 12,
                        background: 'rgba(0,122,255,0.1)', color: 'var(--blue)',
                        opacity: savingId === u.id ? 0.5 : 1,
                      }}
                    >
                      {savingId === u.id ? '...' : `→ ${u.role === 'ADMIN' ? 'Worker' : 'Admin'}`}
                    </button>
                  </div>
                )}
                {u.id === user.id && (
                  <div style={{ fontSize: 11, color: 'var(--tg-hint)', textAlign: 'center' }}>это вы</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
