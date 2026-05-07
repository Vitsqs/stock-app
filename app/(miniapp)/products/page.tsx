'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n-context'

export default function ProductsPage() {
  const { t } = useLocale()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>({})

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
  }, [])

  const load = useCallback((q = '') => {
    setLoading(true)
    const url = q ? `/api/products?search=${encodeURIComponent(q)}` : '/api/products'
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setTimeout(() => load(search), 280)
    return () => clearTimeout(t)
  }, [search, load])

  return (
    <div style={{ padding: '16px 16px 8px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          {t('products')}
        </h1>
        {user.role === 'ADMIN' && (
          <button
            className="btn btn-primary animate-scale-in"
            onClick={() => router.push('/products/new')}
            style={{ padding: '9px 16px', fontSize: 14 }}
          >
            + {t('addProduct')}
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, color: 'var(--tg-hint)',
        }}>🔍</span>
        <input
          className="input"
          placeholder={t('search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 42, borderRadius: 12 }}
        />
      </div>

      {/* Count */}
      {!loading && (
        <p className="animate-fade-in" style={{ fontSize: 12, color: 'var(--tg-hint)', marginBottom: 10, marginLeft: 2 }}>
          Найдено: {products.length}
        </p>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 15, width: '65%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '35%' }} />
              </div>
              <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="card animate-scale-in" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
          <p style={{ color: 'var(--tg-hint)', fontSize: 14, marginBottom: 16 }}>{t('noProducts')}</p>
          {user.role === 'ADMIN' && (
            <button
              className="btn btn-primary"
              onClick={() => router.push('/products/new')}
              style={{ padding: '12px 24px', margin: '0 auto' }}
            >
              + {t('addProduct')}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map((p, i) => {
          const isZero = p.currentStock === 0
          const isLow = !isZero && p.minStock > 0 && p.currentStock <= p.minStock
          const stockColor = isZero ? 'var(--red)' : isLow ? 'var(--orange)' : 'var(--green)'
          const stockBg    = isZero ? 'rgba(255,59,48,0.10)' : isLow ? 'rgba(255,149,0,0.12)' : 'rgba(52,199,89,0.12)'

          return (
            <button
              key={p.id}
              className={`card animate-slide-up delay-${Math.min(i+1,5)}`}
              onClick={() => router.push(`/products/${p.id}`)}
              style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 15, color: 'var(--tg-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 3 }}>
                  {p.sku}{p.volume && ` · ${p.volume}`}
                </div>
                {isLow && (
                  <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 4, fontWeight: 600 }}>
                    ⚠️ Низкий остаток
                  </div>
                )}
              </div>

              {/* Stock badge */}
              <div style={{
                background: stockBg,
                borderRadius: 12, padding: '8px 14px',
                textAlign: 'center', flexShrink: 0, minWidth: 58,
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: stockColor, lineHeight: 1 }}>
                  {p.currentStock}
                </div>
                <div style={{ fontSize: 11, color: stockColor, marginTop: 2 }}>{p.unit}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
