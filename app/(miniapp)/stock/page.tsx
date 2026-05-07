'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n-context'

const OPS = [
  { key: 'income',     label: 'Приход',       icon: '⬆️', color: 'var(--green)'  },
  { key: 'outcome',    label: 'Расход',        icon: '⬇️', color: 'var(--red)'    },
  { key: 'adjustment', label: 'Корректировка', icon: '✏️', color: 'var(--blue)'   },
]

function StockForm() {
  const { t } = useLocale()
  const router = useRouter()
  const sp = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState(sp.get('productId') || '')
  const [operation, setOperation] = useState(sp.get('op') || 'income')
  const [quantity, setQuantity]   = useState('')
  const [newStock, setNewStock]   = useState('')
  const [comment, setComment]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [loadingP, setLoadingP]   = useState(true)
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/products', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoadingP(false) })
      .catch(() => setLoadingP(false))
  }, [])

  const current = products.find(p => p.id === productId)
  const opMeta  = OPS.find(o => o.key === operation)!

  const isValid = productId && (
    operation === 'adjustment'
      ? newStock !== '' && Number(newStock) >= 0
      : quantity !== '' && Number(quantity) > 0
  )

  const submit = async () => {
    if (!isValid) return
    setLoading(true); setMsg(null)

    const body: any = { operation, productId, comment: comment.trim() || undefined }
    if (operation === 'adjustment') body.newStock  = Math.round(Number(newStock))
    else                             body.quantity  = Math.round(Number(quantity))

    try {
      const res = await fetch('/api/stock', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        setMsg({ text: `✅ ${t('stockUpdated')}`, ok: true })
        setQuantity(''); setNewStock(''); setComment('')
        fetch('/api/products', { credentials: 'include' }).then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []))
        setTimeout(() => setMsg(null), 2500)
      } else {
        setMsg({
          text: data.code === 'INSUFFICIENT_STOCK'
            ? `❌ ${t('insufficientStock')}: ${data.error}`
            : `❌ ${data.error}`,
          ok: false,
        })
      }
    } catch {
      setLoading(false)
      setMsg({ text: '❌ Нет соединения', ok: false })
    }
  }

  return (
    <div style={{ padding: '16px 16px 8px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 16 }}>
        {t('changeStock')}
      </h1>

      {/* Operation tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
        {OPS.map(op => {
          const active = operation === op.key
          return (
            <button
              key={op.key}
              className="btn"
              onClick={() => { setOperation(op.key); setMsg(null) }}
              style={{
                padding: '13px 6px',
                flexDirection: 'column', gap: 4,
                fontSize: 12, fontWeight: 600,
                background: active ? op.color : 'var(--card-bg)',
                color: active ? '#fff' : 'var(--tg-hint)',
                boxShadow: active ? `0 4px 14px ${op.color}40` : 'var(--card-shadow)',
                border: `1px solid ${active ? 'transparent' : 'var(--card-border)'}`,
                transform: active ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 0.18s ease',
              }}
            >
              <span style={{ fontSize: 20 }}>{op.icon}</span>
              {op.label}
            </button>
          )
        })}
      </div>

      {/* Product */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--tg-hint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Товар
        </label>
        {loadingP ? (
          <div className="skeleton" style={{ height: 52, borderRadius: 12 }} />
        ) : (
          <select
            className="input"
            value={productId}
            onChange={e => { setProductId(e.target.value); setMsg(null) }}
          >
            <option value="">— Выберите товар —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.volume ? ` (${p.volume})` : ''} · {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Current stock info */}
      {current && (
        <div className="card animate-scale-in" style={{ padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--tg-hint)' }}>Сейчас на остатке</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>
            {current.currentStock} {current.unit}
          </span>
        </div>
      )}

      {/* Amount input */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--tg-hint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {operation === 'adjustment' ? t('newStockValue') : t('quantity')}
        </label>
        <input
          className="input"
          type="number" inputMode="numeric"
          min={operation === 'adjustment' ? '0' : '1'}
          value={operation === 'adjustment' ? newStock : quantity}
          onChange={e => operation === 'adjustment' ? setNewStock(e.target.value) : setQuantity(e.target.value)}
          placeholder="0"
          style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, padding: '16px', letterSpacing: -1 }}
        />

        {/* Preview */}
        {current && operation === 'adjustment' && newStock !== '' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: 6, fontSize: 13, color: 'var(--tg-hint)' }}>
            Изменение: <span style={{ fontWeight: 700, color: Number(newStock) >= current.currentStock ? 'var(--green)' : 'var(--red)' }}>
              {Number(newStock) - current.currentStock > 0 ? '+' : ''}{Number(newStock) - current.currentStock}
            </span>
          </div>
        )}
        {current && operation === 'outcome' && quantity && (
          <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: 6, fontSize: 13, color: 'var(--tg-hint)' }}>
            После списания: <span style={{ fontWeight: 700, color: current.currentStock - Number(quantity) < 0 ? 'var(--red)' : 'var(--green)' }}>
              {current.currentStock - Number(quantity)} {current.unit}
            </span>
          </div>
        )}
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--tg-hint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Комментарий <span style={{ fontWeight: 400, textTransform: 'none' }}>(необязательно)</span>
        </label>
        <input
          className="input"
          type="text" value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Например: поставка от поставщика"
          maxLength={200}
        />
      </div>

      {/* Message */}
      {msg && (
        <div
          className="animate-slide-up"
          style={{
            padding: '14px 16px', borderRadius: 12, marginBottom: 14,
            background: msg.ok ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.10)',
            color: msg.ok ? '#1a7a34' : '#c0392b',
            fontWeight: 600, fontSize: 14, textAlign: 'center',
            border: `1px solid ${msg.ok ? 'rgba(52,199,89,0.3)' : 'rgba(255,59,48,0.2)'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Submit */}
      <button
        className="btn"
        onClick={submit}
        disabled={loading || !isValid}
        style={{
          width: '100%', padding: '17px',
          background: isValid ? opMeta.color : 'var(--tg-secondary)',
          color: isValid ? '#fff' : 'var(--tg-hint)',
          fontSize: 16, fontWeight: 700,
          boxShadow: isValid ? `0 6px 20px ${opMeta.color}50` : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            Сохраняем...
          </span>
        ) : t('save')}
      </button>
    </div>
  )
}

export default function StockPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', padding:48 }}><div className="spinner"/></div>}>
      <StockForm />
    </Suspense>
  )
}
