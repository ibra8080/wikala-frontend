// app/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicNavbar from '@/components/ui/PublicNavbar'
import PublicFooter from '@/components/ui/PublicFooter'

const content = {
  en: {
    hero: {
      badge: 'Made in Egypt · Sold in Europe',
      title: 'Sell Your Egyptian Products Across Europe',
      subtitle: 'We handle logistics, storage, and sales — you focus on making great products.',
      cta: 'Start Selling',
      ctaSub: 'See our pricing',
    },
    how: {
      title: 'How It Works',
      steps: [
        { num: '01', title: 'Register & Get Approved', desc: 'Create your seller account. Our team reviews your application within 3–5 business days.' },
        { num: '02', title: 'Send Your Products', desc: 'Ship your products to our warehouse in Germany. We handle customs and storage.' },
        { num: '03', title: 'We Sell For You', desc: 'Your products appear on our Shopify storefront. We manage sales across Europe.' },
        { num: '04', title: 'Get Paid Monthly', desc: 'Receive a detailed monthly statement with your earnings after all fees.' },
      ]
    },
    why: {
      title: 'Why Wikala?',
      items: [
        { icon: '🤝', title: 'Consignment Model', desc: 'No upfront payment. You get paid after your products are sold.' },
        { icon: '🏭', title: 'Full Logistics', desc: 'We handle shipping, customs, warehousing, and last-mile delivery in Germany.' },
        { icon: '📊', title: 'Full Transparency', desc: 'Track your inventory, sales, and earnings in real-time through your dashboard.' },
        { icon: '🌍', title: 'European Market', desc: 'Reach Arab communities across Germany and Europe without leaving Egypt.' },
      ]
    },
    cta2: {
      title: 'Ready to Start?',
      subtitle: 'Join Wikala and bring your Egyptian products to European markets.',
      btn: 'Create Your Seller Account',
    },
  },
  ar: {
    hero: {
      badge: 'صُنع في مصر · يُباع في أوروبا',
      title: 'بع منتجاتك المصرية في أوروبا',
      subtitle: 'نحن نتولى الشحن والتخزين والمبيعات — أنت فقط ركّز على صنع منتجات رائعة.',
      cta: 'ابدأ البيع الآن',
      ctaSub: 'اعرف التكاليف',
    },
    how: {
      title: 'كيف تعمل وكالة؟',
      steps: [
        { num: '01', title: 'سجّل واحصل على الموافقة', desc: 'أنشئ حساب البائع. يراجع فريقنا طلبك خلال 3–5 أيام عمل.' },
        { num: '02', title: 'أرسل منتجاتك', desc: 'اشحن منتجاتك إلى مستودعنا في ألمانيا. نحن نتولى الجمارك والتخزين.' },
        { num: '03', title: 'نبيع عنك', desc: 'تظهر منتجاتك على متجرنا الإلكتروني. نحن ندير المبيعات في أوروبا.' },
        { num: '04', title: 'استلم أموالك شهرياً', desc: 'احصل على كشف حساب شهري مفصّل بأرباحك بعد خصم جميع الرسوم.' },
      ]
    },
    why: {
      title: 'لماذا وكالة؟',
      items: [
        { icon: '🤝', title: 'نموذج الأمانة', desc: 'لا دفع مسبق. تحصل على أموالك بعد بيع منتجاتك.' },
        { icon: '🏭', title: 'لوجستيات متكاملة', desc: 'نتولى الشحن والجمارك والتخزين والتوصيل داخل ألمانيا.' },
        { icon: '📊', title: 'شفافية كاملة', desc: 'تابع مخزونك ومبيعاتك وأرباحك في الوقت الفعلي.' },
        { icon: '🌍', title: 'السوق الأوروبي', desc: 'اوصل للجاليات العربية في ألمانيا وأوروبا دون مغادرة مصر.' },
      ]
    },
    cta2: {
      title: 'مستعد للبدء؟',
      subtitle: 'انضم إلى وكالة وأوصل منتجاتك المصرية إلى الأسواق الأوروبية.',
      btn: 'أنشئ حساب بائع',
    },
  }
}

export default function LandingPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const t = content[lang]
  const isAr = lang === 'ar'

  return (
    <div className={`min-h-screen bg-[#FAFAF8] ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>

      <PublicNavbar lang={lang} onLangChange={setLang} />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#C8952E]/10 text-[#C8952E] border border-[#C8952E]/20 mb-6">
          {t.hero.badge}
        </span>
        <h1 className="text-5xl font-bold text-[#1B2A4A] mb-6 leading-tight max-w-3xl mx-auto">
          {t.hero.title}
        </h1>
        <p className="text-lg text-[#6B6560] mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register"
            className="bg-[#C8952E] text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-[#b07d25] transition shadow-sm">
            {t.hero.cta}
          </Link>
          <Link href={`/pricing?lang=${lang}`}
            className="text-[#1B2A4A] px-6 py-3.5 rounded-xl text-base font-medium border border-[#E0DDDA] hover:bg-[#F5F4F0] transition">
            {t.hero.ctaSub} →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#E0DDDA] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-16">{t.how.title}</h2>
          <div className="grid grid-cols-4 gap-8">
            {t.how.steps.map((step, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="absolute top-6 left-full w-full h-px bg-[#E0DDDA] -translate-x-4 hidden lg:block" />
                )}
                <div className="text-3xl font-bold text-[#C8952E]/20 mb-3">{step.num}</div>
                <h3 className="font-semibold text-[#1B2A4A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B6560] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Wikala */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-16">{t.why.title}</h2>
        <div className="grid grid-cols-2 gap-6">
          {t.why.items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E0DDDA] p-6 hover:border-[#C8952E] transition">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-[#1B2A4A] mb-2">{item.title}</h3>
              <p className="text-sm text-[#6B6560] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1B2A4A] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t.cta2.title}</h2>
          <p className="text-[#FAFAF8]/70 mb-10 max-w-xl mx-auto">{t.cta2.subtitle}</p>
          <Link href="/register"
            className="bg-[#C8952E] text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-[#b07d25] transition">
            {t.cta2.btn}
          </Link>
        </div>
      </section>

      <PublicFooter lang={lang} />
    </div>
  )
}
