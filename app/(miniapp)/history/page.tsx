'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n-context'

const OP: Record<string, { color: string; bg: string; symbol: string; label: string }> = {
  INCOME:     { color: '#1a7a34', bg: 'rgba(52,199,89,0.12)',  symbol: '+', label: 'Приход' },
  OUTCOME:    { color: '#c0392b', bg: 'rgba(255,59,48,0.10)',  symbol: '−', label: 'Расход' },
  ADJUSTMENT: { color: '#0055cc', bg: 'rgba(0,122,255,0.10)', symbol: '↕', label: 'Корректировка' },
}

function HistoryList() {
  const { t } = useLocale()
  const router = useRouter()
  const sp = useSearchParams()

  const [movements, setMovements] = useState<any[]>([])
  const [products,  setProducts]  = useState<any[]>([])
  const [filterP,   setFilterP]   = useState(sp.get('productId') || '')
  const [filterT,   setFilterT]   = useState('')
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/products', { credentials: 'include' })
      .then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filterP) p.set('productId', filterP)
    if (filterT) p.set('type', filterT)
    p.set('page', String(page))
    fetch(`/api/movements?${p}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setMovements(d.movements ?? []); setTotal(d.total ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filterP, filterT, page])

  const totalPages = Math.ceil(total / 30)

  return (
    <div style={{ padding: '16px 16px 8px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 14 }}>
        {t('history')}
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <select className="input" value={filterT}
          onChange={e => { setFilterT(e.target.value); setPage(1) }}>
          <option value="">{t('allTypes')}</option>
          <option value="INCOME">⬆️ {t('income')}</option>
          <option value="OUTCOME">⬇️ {t('outcome')}</option>
          <option value="ADJUSTMENT">✏️ {t('adjustment')}</option>
        </select>
        <select className="input" value={filterP}
          onChange={e => { setFilterP(e.target.value); setPage(1) }}>
          <option value="">{t('allProducts')}</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.volume && ` (${p.volume})`}</option>
          ))}
        </select>
        {(filterP || filterT) && (
          <button
            onClick={() => { setFilterP(''); setFilterT(''); setPage(1) }}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
          >
            ✕ Сбросить фильтры
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 12, color: 'var(--tg-hint)' }}>Операций: {total}</p>
        {totalPages > 1 && <p style={{ fontSize: 12, color: 'var(--tg-hint)' }}>Стр. {page}/{totalPages}</p>}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '40%' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && movements.length === 0 && (
        <div className="card animate-scale-in" style={{ padding: 40, textAlign: 'center', color: 'var(--tg-hint)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <p style={{ fontSize: 14 }}>{t('noMovements')}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {movements.map((m, i) => {
          const op   = OP[m.type] ?? OP.ADJUSTMENT
          const diff = m.newStock - m.previousStock
          const name = m.user?.firstName || m.user?.username || '—'

          return (
            <button
              key={m.id}
              className={`card animate-slide-up delay-${Math.min(i+1,5)}`}
              onClick={() => router.push(`/products/${m.productId}`)}
              style={{ padding: '12px 14px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: op.bg, color: op.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700,
                }}>
                  {op.symbol}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.product?.name}
                  </div>
                  <div style={{ fontSize: 12, color: op.color, marginTop: 2 }}>{op.label}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.previousStock} → {m.newStock}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: op.color }}>
                    {diff > 0 ? '+' : ''}{diff}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: 11, color: 'var(--tg-hint)' }}>👤 {name}</span>
                <div style={{ textAlign: 'right' }}>
                  {m.comment && <div style={{ fontSize: 11, color: 'var(--tg-hint)', fontStyle: 'italic' }}>"{m.comment}"</div>}
                  <span style={{ fontSize: 11, color: 'var(--tg-hint)' }}>
                    {new Date(m.createdAt).toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingTop: 12 }}>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
            style={{ padding: '12px 20px', fontSize: 14, opacity: page===1 ? 0.4 : 1 }}>
            ← Назад
          </button>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page>=totalPages}
            style={{ padding: '12px 20px', fontSize: 14, opacity: page>=totalPages ? 0.4 : 1 }}>
            Далее →
          </button>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', padding:48 }}><div className="spinner"/></div>}>
      <HistoryList />
    </Suspense>
  )
}
