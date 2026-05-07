'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n-context'

const OP: Record<string, { color: string; bg: string; symbol: string; label: string }> = {
  INCOME:     { color: '#1a7a34', bg: 'rgba(52,199,89,0.12)',  symbol: '+', label: 'Приход' },
  OUTCOME:    { color: '#c0392b', bg: 'rgba(255,59,48,0.10)',  symbol: '−', label: 'Расход' },
  ADJUSTMENT: { color: '#0055cc', bg: 'rgba(0,122,255,0.10)', symbol: '↕', label: 'Корректировка' },
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const { t } = useLocale()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [user, setUser] = useState<any>({})

  const load = useCallback(() => {
    fetch(`/api/products/${params.id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProduct(d) })
  }, [params.id])

  useEffect(() => {
    load()
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
  }, [load])

  if (!product) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  const isZero = product.currentStock === 0
  const isLow  = !isZero && product.minStock > 0 && product.currentStock <= product.minStock
  const stockColor = isZero ? 'var(--red)' : isLow ? 'var(--orange)' : 'var(--green)'

  return (
    <div style={{ padding: '12px 16px' }}>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 15, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        ← Назад
      </button>

      {/* Header card */}
      <div className="card animate-scale-in" style={{ padding: '20px 20px 24px', marginBottom: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, marginBottom: 4 }}>
            {product.name}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--tg-hint)' }}>
            {product.sku}{product.volume && ` · ${product.volume}`} · {product.unit}
          </div>
          {product.description && (
            <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 6 }}>
              {product.description}
            </div>
          )}
        </div>

        {/* Big stock number */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
          <span className="stock-number" style={{ color: stockColor }}>
            {product.currentStock}
          </span>
          <span style={{ fontSize: 20, color: 'var(--tg-hint)', paddingBottom: 6 }}>
            {product.unit}
          </span>
        </div>

        {isZero && <div className="badge badge-red">🚫 Нет в наличии</div>}
        {isLow  && <div className="badge badge-orange">⚠️ Низкий остаток</div>}
        {!isZero && !isLow && <div className="badge badge-green">✓ В наличии</div>}

        {product.minStock > 0 && (
          <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 8 }}>
            Минимум: {product.minStock} {product.unit}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { op: 'income',     label: t('income'),     icon: '⬆️', color: 'var(--green)'  },
          { op: 'outcome',    label: t('outcome'),    icon: '⬇️', color: 'var(--red)'    },
          { op: 'adjustment', label: t('adjustment'), icon: '✏️', color: 'var(--blue)'   },
        ].map(a => (
          <button
            key={a.op}
            className="btn animate-fade-in"
            onClick={() => router.push(`/stock?op=${a.op}&productId=${product.id}`)}
            style={{
              padding: '14px 8px',
              background: a.color,
              color: '#fff',
              flexDirection: 'column',
              gap: 4,
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 20 }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* Deactivate (admin only) */}
      {user.role === 'ADMIN' && (
        <button
          className="btn btn-secondary animate-fade-in"
          style={{ width: '100%', padding: '12px', marginBottom: 16, fontSize: 13 }}
          onClick={async () => {
            if (!confirm(product.isActive ? 'Деактивировать товар?' : 'Активировать товар?')) return
            await fetch(`/api/products/${product.id}`, {
              method: 'PATCH', credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !product.isActive }),
            })
            load()
          }}
        >
          {product.isActive ? '🗃 Деактивировать' : '✅ Активировать'}
        </button>
      )}

      {/* History */}
      <div className="animate-fade-in delay-2">
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>{t('history')}</p>

        {product.movements.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--tg-hint)', fontSize: 14 }}>
            {t('noMovements')}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {product.movements.map((m: any) => {
            const op = OP[m.type] ?? OP.ADJUSTMENT
            const diff = m.newStock - m.previousStock
            return (
              <div key={m.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: op.bg, color: op.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700,
                  }}>
                    {op.symbol}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: op.color }}>{op.label}</div>
                    {m.comment && (
                      <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 1 }}>"{m.comment}"</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--tg-text)' }}>
                      {m.previousStock} → {m.newStock}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: op.color }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--tg-hint)' }}>
                    👤 {m.user?.firstName || m.user?.username || '—'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--tg-hint)' }}>
                    {new Date(m.createdAt).toLocaleString('ru', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {product.movements.length > 0 && (
          <button
            onClick={() => router.push(`/history?productId=${product.id}`)}
            style={{ width: '100%', padding: '14px', color: 'var(--blue)', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
          >
            Вся история →
          </button>
        )}
      </div>
    </div>
  )
}
