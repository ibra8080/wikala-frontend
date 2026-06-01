// app/pricing/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

const content = {
  en: {
    nav: { home: 'Home', login: 'Login', register: 'Start Selling' },
    hero: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'No hidden fees. You only pay after your products are sold.',
    },
    fees: [
      {
        icon: '🏪',
        title: 'Seller Registration',
        price: '€39.90',
        period: 'one time',
        desc: 'Pay once when your account is approved. Stays active as long as your account is active.',
        mandatory: true,
      },
      {
        icon: '📦',
        title: 'Product Listing',
        price: '€2.00',
        period: 'per product / month',
        desc: 'First month free after approval. First 4 variants included. Each additional variant: €0.50/month.',
        mandatory: true,
      },
      {
        icon: '🏭',
        title: 'Warehouse Storage',
        price: '€25.00',
        period: 'per m³ / month',
        desc: 'Calculated based on carton dimensions × quantity in Germany warehouse. +15% buffer space included.',
        mandatory: true,
      },
      {
        icon: '🤝',
        title: 'Wikala Commission',
        price: '15%',
        period: 'per unit sold',
        desc: 'Deducted from the selling price after each sale. Covers platform, payment processing, and support.',
        mandatory: true,
      },
      {
        icon: '📬',
        title: 'Pick & Pack',
        price: '€1.00',
        period: 'per unit sold',
        desc: 'Covers order picking, packaging, and preparation for delivery within Germany.',
        mandatory: true,
      },
      {
        icon: '🚢',
        title: 'Shipping Egypt → Germany',
        price: 'Variable',
        period: 'per shipment',
        desc: 'Based on chargeable weight (max of actual weight vs volumetric weight). Rate set per shipment.',
        mandatory: true,
      },
      {
        icon: '🏛️',
        title: 'VAT',
        price: '19%',
        period: 'of selling price',
        desc: 'German VAT applied to all sales. Managed and filed by Wikala on your behalf.',
        mandatory: true,
      },
    ],
    example: {
      title: 'Pricing Example',
      subtitle: 'A product selling for €50 with 10 units in Germany warehouse for 2 months:',
      rows: [
        { label: 'Selling Price', value: '€50.00', highlight: false },
        { label: 'Production Cost (your cost)', value: '−€10.00', highlight: false },
        { label: 'Storage (2 months, small item)', value: '−€1.50', highlight: false },
        { label: 'Wikala Commission (15%)', value: '−€7.50', highlight: false },
        { label: 'Pick & Pack', value: '−€1.00', highlight: false },
        { label: 'VAT (19%)', value: '−€9.50', highlight: false },
        { label: 'Shipping Egypt → Germany (est. ~€10/kg)', value: '−€10.00', highlight: false, estimate: true },
        { label: 'Your Estimated Profit', value: '€10.50', highlight: true },
      ],
      note: '* Shipping costs from Egypt are calculated separately per shipment and deducted in your monthly statement.',
    },
    cta: {
      title: 'Ready to Start?',
      btn: 'Create Your Seller Account',
    }
  },
  ar: {
    nav: { home: 'الرئيسية', login: 'تسجيل الدخول', register: 'ابدأ البيع' },
    hero: {
      title: 'تسعير بسيط وشفاف',
      subtitle: 'لا رسوم خفية. تدفع فقط بعد بيع منتجاتك.',
    },
    fees: [
      {
        icon: '🏪',
        title: 'رسوم تسجيل البائع',
        price: '€39.90',
        period: 'مرة واحدة',
        desc: 'تُدفع مرة واحدة عند الموافقة على حسابك. تبقى سارية طالما حسابك نشط.',
        mandatory: true,
      },
      {
        icon: '📦',
        title: 'رسوم إدراج المنتج',
        price: '€2.00',
        period: 'لكل منتج / شهرياً',
        desc: 'الشهر الأول مجاني بعد الموافقة. أول 4 variants مجانية. كل variant إضافي: €0.50/شهر.',
        mandatory: true,
      },
      {
        icon: '🏭',
        title: 'رسوم التخزين',
        price: '€25.00',
        period: 'لكل م³ / شهرياً',
        desc: 'تُحسب بناءً على أبعاد الكرتون × الكمية في مستودع ألمانيا. يشمل 15% مساحة احتياطية.',
        mandatory: true,
      },
      {
        icon: '🤝',
        title: 'عمولة وكالة',
        price: '15%',
        period: 'لكل وحدة مباعة',
        desc: 'تُخصم من سعر البيع بعد كل عملية بيع. تشمل المنصة ومعالجة الدفع والدعم.',
        mandatory: true,
      },
      {
        icon: '📬',
        title: 'التعبئة والتغليف',
        price: '€1.00',
        period: 'لكل وحدة مباعة',
        desc: 'يشمل تجهيز الطلب والتغليف والتحضير للتوصيل داخل ألمانيا.',
        mandatory: true,
      },
      {
        icon: '🚢',
        title: 'الشحن مصر → ألمانيا',
        price: 'متغير',
        period: 'لكل شحنة',
        desc: 'بناءً على الوزن القابل للشحن (الأكبر بين الوزن الفعلي والحجمي). السعر يُحدد لكل شحنة.',
        mandatory: true,
      },
      {
        icon: '🏛️',
        title: 'ضريبة القيمة المضافة',
        price: '19%',
        period: 'من سعر البيع',
        desc: 'ضريبة القيمة المضافة الألمانية تُطبق على جميع المبيعات. تتولى وكالة إدارتها وتقديمها.',
        mandatory: true,
      },
    ],
    example: {
      title: 'مثال توضيحي',
      subtitle: 'منتج بسعر بيع €50 مع 10 وحدات في مستودع ألمانيا لمدة شهرين:',
      rows: [
        { label: 'سعر البيع', value: '€50.00', highlight: false },
        { label: 'تكلفة الإنتاج (تكلفتك)', value: '−€10.00', highlight: false },
        { label: 'تكلفة التخزين (شهرين، منتج صغير)', value: '−€1.50', highlight: false },
        { label: 'عمولة وكالة (15%)', value: '−€7.50', highlight: false },
        { label: 'التعبئة والتغليف', value: '−€1.00', highlight: false },
        { label: 'ضريبة القيمة المضافة (19%)', value: '−€9.50', highlight: false },
        { label: 'الشحن مصر → ألمانيا (تقديري ~€10/كجم)', value: '−€10.00', highlight: false, estimate: true },
        { label: 'ربحك المتوقع', value: '€10.50', highlight: true },
      ],
      note: '* تكاليف الشحن من مصر تُحسب بشكل منفصل لكل شحنة وتُخصم في كشف حسابك الشهري.',
    },
    cta: {
      title: 'مستعد للبدء؟',
      btn: 'أنشئ حساب بائع',
    }
  }
}

export default function PricingPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const t = content[lang]
  const isAr = lang === 'ar'

  return (
    <div className={`min-h-screen bg-[#FAFAF8]`} dir={isAr ? 'rtl' : 'ltr'}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#E0DDDA]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/wikala_Logo.svg" alt="Wikala" className="h-8" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.nav.home}</Link>
            <Link href="/login" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.nav.login}</Link>
            <Link href="/register"
              className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
              {t.nav.register}
            </Link>
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs border border-[#E0DDDA] px-3 py-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F4F0] transition">
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-[#1B2A4A] mb-4">{t.hero.title}</h1>
        <p className="text-lg text-[#6B6560]">{t.hero.subtitle}</p>
      </section>

      {/* Fees Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-4">
          {t.fees.map((fee, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E0DDDA] p-6 hover:border-[#C8952E] transition">
              <div className="text-3xl mb-3">{fee.icon}</div>
              <h3 className="font-semibold text-[#1B2A4A] mb-1">{fee.title}</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-[#C8952E]">{fee.price}</span>
                <span className="text-xs text-[#6B6560]">{fee.period}</span>
              </div>
              <p className="text-sm text-[#6B6560] leading-relaxed">{fee.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
          <div className="px-8 py-6 border-b border-[#E0DDDA] bg-[#F5F4F0]">
            <h2 className="text-xl font-bold text-[#1B2A4A]">{t.example.title}</h2>
            <p className="text-sm text-[#6B6560] mt-1">{t.example.subtitle}</p>
          </div>
          <div className="px-8 py-6">
            {t.example.rows.map((row, i) => (
              <div key={i}
                className={`flex items-center justify-between py-3 border-b border-[#E0DDDA] last:border-0
                  ${row.highlight ? 'bg-green-50 -mx-8 px-8 rounded-b-2xl' : ''}`}>
                <span className={`text-sm
                  ${row.highlight ? 'font-semibold text-green-700' :
                    row.estimate ? 'text-amber-600 italic' : 'text-[#6B6560]'}`}>
                  {row.label}
                </span>
                <span className={`font-semibold
                  ${row.highlight ? 'text-green-700 text-lg' :
                    row.estimate ? 'text-amber-600' : 'text-[#1B2A4A]'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="px-8 pb-6">
            <p className="text-xs text-[#6B6560] bg-[#F5F4F0] rounded-xl px-4 py-3 border border-[#E0DDDA]">
              ⚠️ {t.example.note}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B2A4A] py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">{t.cta.title}</h2>
          <Link href="/register"
            className="bg-[#C8952E] text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-[#b07d25] transition">
            {t.cta.btn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B2A4A] border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <img src="/wikala_Logo_W.svg" alt="Wikala" className="h-7 mx-auto mb-3" />
          <p className="text-xs text-white/30">© 2026 Wikala. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}