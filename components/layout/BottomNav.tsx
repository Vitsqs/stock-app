'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/lib/i18n-context'

const NAV = [
  { href: '/',         icon: '🏠', key: 'home'        },
  { href: '/products', icon: '📦', key: 'products'    },
  { href: '/stock',    icon: '✏️', key: 'changeStock' },
  { href: '/history',  icon: '📋', key: 'history'     },
  { href: '/settings', icon: '⚙️', key: 'settings'   },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  return (
    <nav className="bottom-nav">
      <div style={{ display: 'flex' }}>
        {NAV.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 4px 6px',
                textDecoration: 'none',
                color: active ? 'var(--blue)' : 'var(--tg-hint)',
                transition: 'color 0.2s, transform 0.15s',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                gap: 2,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                letterSpacing: 0.2,
                transition: 'font-weight 0.15s',
              }}>
                {t(item.key)}
              </span>
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  width: 28,
                  height: 2.5,
                  borderRadius: '0 0 3px 3px',
                  background: 'var(--blue)',
                }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
