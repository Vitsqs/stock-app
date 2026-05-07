'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n-context'

export default function NewProductPage() {
  const { t } = useLocale()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', sku: '', unit: 'шт', volume: '',
    barcode: '', description: '', minStock: '0', initialStock: '0',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) { setError('Введите название'); return }
    if (!form.sku.trim())  { setError('Введите артикул');  return }
    setLoading(true); setError('')

    const res = await fetch('/api/products', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, minStock: Number(form.minStock)||0, initialStock: Number(form.initialStock)||0 }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) router.push('/products')
    else setError(data.error || t('errorOccurred'))
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <button onClick={() => router.back()}
        style={{ background:'none', border:'none', color:'var(--blue)', fontSize:15, cursor:'pointer', marginBottom:12 }}>
        ← Назад
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 18 }}>
        {t('addProduct')}
      </h1>

      {error && (
        <div className="animate-slide-up" style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 14,
          background: 'rgba(255,59,48,0.10)', color: 'var(--red)',
          fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,59,48,0.2)',
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { key: 'name',     label: t('name'),    placeholder: 'Крем увлажняющий', required: true  },
          { key: 'sku',      label: t('sku'),      placeholder: 'CRM-001',           required: true  },
          { key: 'volume',   label: t('volume'),   placeholder: '50 мл',             required: false },
          { key: 'barcode',  label: t('barcode'),  placeholder: '4600000000000',      required: false },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--tg-hint)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
              {f.label}{f.required && <span style={{ color:'var(--red)' }}> *</span>}
            </label>
            <input className="input" value={(form as any)[f.key]} onChange={set(f.key)} placeholder={f.placeholder} />
          </div>
        ))}

        {/* Unit */}
        <div>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--tg-hint)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
            {t('unit')} <span style={{ color:'var(--red)' }}>*</span>
          </label>
          <select className="input" value={form.unit} onChange={set('unit')}>
            {['шт','мл','л','г','кг','уп','флак','тюб'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--tg-hint)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
            {t('description')} <span style={{ fontWeight:400, textTransform:'none', color:'var(--tg-hint)' }}>(необязательно)</span>
          </label>
          <textarea className="input" value={form.description}
            onChange={e => setForm(f=>({...f, description: e.target.value}))}
            rows={2} placeholder="Краткое описание..." style={{ resize:'none' }} />
        </div>

        {/* Min & initial */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { key:'minStock',     label:t('minStock')     },
            { key:'initialStock', label:t('initialStock') },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--tg-hint)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.4 }}>
                {f.label}
              </label>
              <input className="input" type="number" inputMode="numeric" min="0"
                value={(form as any)[f.key]} onChange={set(f.key)}
                style={{ textAlign:'center', fontSize:18, fontWeight:700, padding:'12px 8px' }} />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingTop:4 }}>
          <button className="btn btn-secondary" onClick={() => router.back()} style={{ padding:'15px' }}>
            {t('cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading || !form.name.trim() || !form.sku.trim()}
            style={{ padding:'15px', opacity: loading || !form.name.trim() || !form.sku.trim() ? 0.5 : 1 }}
          >
            {loading ? '⏳ ...' : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
