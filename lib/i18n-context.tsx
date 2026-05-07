'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Locale, TranslationKey } from './i18n'

interface LocaleContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'ru',
  setLocale: () => {},
  t: (k) => k,
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('locale') as Locale
    if (saved === 'ru' || saved === 'ro') setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
  }

  const t = (key: TranslationKey): string =>
    translations[locale][key] ?? translations['ru'][key] ?? key

  // Пока не смонтировано — отдаём русский (SSR-safe)
  if (!mounted) {
    return (
      <LocaleContext.Provider value={{ locale: 'ru', setLocale, t }}>
        {children}
      </LocaleContext.Provider>
    )
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
