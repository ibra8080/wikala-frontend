'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CostCalculator from '@/components/ui/CostCalculator'

const translations = {
  en: { calculator: 'Profit Calculator', pricing: 'Pricing', help: 'Help Center', login: 'Sign In', register: 'Start Selling' },
  ar: { calculator: 'حاسبة الأرباح', pricing: 'الأسعار', help: 'مركز المساعدة', login: 'تسجيل الدخول', register: 'ابدأ البيع' },
}

interface Props {
  lang: 'en' | 'ar'
  onLangChange: (lang: 'en' | 'ar') => void
}

export default function PublicNavbar({ lang, onLangChange }: Props) {
  const t = translations[lang]
  const [calcOpen, setCalcOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const openCalc = () => {
    setMenuOpen(false)
    setCalcOpen(true)
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#E0DDDA]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/wikala_Logo.svg" alt="Wikala" width={120} height={32} />
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setCalcOpen(true)} className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.calculator}</button>
          <Link href="/pricing" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.pricing}</Link>
          <Link href="/help" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.help}</Link>
          <Link href="/login" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.login}</Link>
          <Link href="/register"
            className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
            {t.register}
          </Link>
          <button
            onClick={() => onLangChange(lang === 'en' ? 'ar' : 'en')}
            className="text-xs border border-[#E0DDDA] px-3 py-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F4F0] transition">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => onLangChange(lang === 'en' ? 'ar' : 'en')}
            className="text-xs border border-[#E0DDDA] px-2.5 py-1.5 rounded-lg text-[#6B6560]">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            className="p-2 text-[#1B2A4A]">
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E0DDDA] bg-[#FAFAF8] px-6 py-4 flex flex-col gap-1">
          <button onClick={openCalc} className="text-start py-2.5 text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.calculator}</button>
          <Link href="/pricing" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.pricing}</Link>
          <Link href="/help" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.help}</Link>
          <Link href="/login" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.login}</Link>
          <Link href="/register" onClick={() => setMenuOpen(false)}
            className="mt-2 bg-[#1B2A4A] text-white px-4 py-3 rounded-lg text-sm font-medium text-center hover:bg-[#243860] transition">
            {t.register}
          </Link>
        </div>
      )}

      <CostCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />
    </nav>
  )
}