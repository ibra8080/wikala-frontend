'use client'
import Image from 'next/image'
import Link from 'next/link'

const translations = {
  en: { pricing: 'Pricing', help: 'Help Center', login: 'Sign In', register: 'Start Selling' },
  ar: { pricing: 'الأسعار', help: 'مركز المساعدة', login: 'تسجيل الدخول', register: 'ابدأ البيع' },
}

interface Props {
  lang: 'en' | 'ar'
  onLangChange: (lang: 'en' | 'ar') => void
}

export default function PublicNavbar({ lang, onLangChange }: Props) {
  const t = translations[lang]
  return (
    <nav className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#E0DDDA]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/wikala_Logo.svg" alt="Wikala" width={120} height={32} />
        </Link>
        <div className="flex items-center gap-6">
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
      </div>
    </nav>
  )
}