// app/welcome/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const content = {
  en: {
    title: 'Welcome to Wikala!',
    subtitle: 'Your seller account has been created. Here\'s what happens next:',
    steps: [
      {
        num: '01',
        status: 'done',
        title: 'Account Created ✓',
        desc: 'Your account is created and under review. Our team will verify your details within 3–5 business days.',
      },
      {
        num: '02',
        status: 'pending',
        title: 'Get Approved',
        desc: 'Once approved, you\'ll receive your unique Seller ID and can start adding products.',
      },
      {
        num: '03',
        status: 'pending',
        title: 'Add Your Products',
        desc: 'Register your products with photos, descriptions, dimensions, and pricing.',
      },
      {
        num: '04',
        status: 'pending',
        title: 'Ship to Germany',
        desc: 'Create a shipment request and send your products to our warehouse in Germany.',
      },
      {
        num: '05',
        status: 'pending',
        title: 'Start Earning',
        desc: 'Your products go live on our store. You receive monthly statements with your earnings.',
      },
    ],
    tips: {
      title: 'While You Wait',
      items: [
        { icon: '📋', title: 'Complete your profile', desc: 'Make sure all your business details are accurate.' },
        { icon: '📸', title: 'Prepare product photos', desc: 'High-quality images on white background work best.' },
        { icon: '📏', title: 'Measure your products', desc: 'Have dimensions and weights ready for each product.' },
        { icon: '💰', title: 'Review pricing', desc: 'Check our pricing page to understand all costs.' },
      ]
    },
    cta: 'Go to Dashboard',
    pricing: 'Review Pricing',
    help: 'Visit Help Center',
  },
  ar: {
    title: 'مرحباً بك في وكالة!',
    subtitle: 'تم إنشاء حساب البائع الخاص بك. إليك ما سيحدث بعد ذلك:',
    steps: [
      {
        num: '01',
        status: 'done',
        title: 'تم إنشاء الحساب ✓',
        desc: 'تم إنشاء حسابك وهو قيد المراجعة. سيتحقق فريقنا من بياناتك خلال 3–5 أيام عمل.',
      },
      {
        num: '02',
        status: 'pending',
        title: 'الحصول على الموافقة',
        desc: 'بعد الموافقة، ستحصل على معرف البائع الخاص بك ويمكنك البدء في إضافة المنتجات.',
      },
      {
        num: '03',
        status: 'pending',
        title: 'أضف منتجاتك',
        desc: 'سجّل منتجاتك مع الصور والأوصاف والأبعاد والتسعير.',
      },
      {
        num: '04',
        status: 'pending',
        title: 'اشحن إلى ألمانيا',
        desc: 'أنشئ طلب شحن وأرسل منتجاتك إلى مستودعنا في ألمانيا.',
      },
      {
        num: '05',
        status: 'pending',
        title: 'ابدأ الربح',
        desc: 'تظهر منتجاتك على متجرنا. تحصل على كشوف حساب شهرية بأرباحك.',
      },
    ],
    tips: {
      title: 'في انتظار الموافقة',
      items: [
        { icon: '📋', title: 'أكمل ملفك الشخصي', desc: 'تأكد من دقة جميع بيانات نشاطك التجاري.' },
        { icon: '📸', title: 'جهّز صور المنتجات', desc: 'الصور عالية الجودة على خلفية بيضاء هي الأفضل.' },
        { icon: '📏', title: 'قِس منتجاتك', desc: 'احتفظ بالأبعاد والأوزان جاهزة لكل منتج.' },
        { icon: '💰', title: 'راجع التسعير', desc: 'تحقق من صفحة التسعير لفهم جميع التكاليف.' },
      ]
    },
    cta: 'اذهب إلى لوحة التحكم',
    pricing: 'مراجعة التسعير',
    help: 'مركز المساعدة',
  }
}

export default function WelcomePage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const { user } = useAuthStore()
  const t = content[lang]
  const isAr = lang === 'ar'

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Navbar */}
      <nav className="bg-[#FAFAF8] border-b border-[#E0DDDA]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/wikala_Logo.svg" alt="Wikala" className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs border border-[#E0DDDA] px-3 py-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F4F0] transition">
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-[#1B2A4A] mb-3">{t.title}</h1>
          {user && (
            <p className="text-[#C8952E] font-medium mb-2">{user.email}</p>
          )}
          <p className="text-[#6B6560]">{t.subtitle}</p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden mb-8">
          {t.steps.map((step, i) => (
            <div key={i}
              className={`flex items-start gap-4 px-6 py-5 border-b border-[#E0DDDA] last:border-0
                ${step.status === 'done' ? 'bg-green-50' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                ${step.status === 'done'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#F5F4F0] text-[#6B6560]'}`}>
                {step.status === 'done' ? '✓' : step.num}
              </div>
              <div>
                <p className={`font-semibold mb-1 ${step.status === 'done' ? 'text-green-700' : 'text-[#1B2A4A]'}`}>
                  {step.title}
                </p>
                <p className="text-sm text-[#6B6560] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mb-10">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">{t.tips.title}</h2>
          <div className="grid grid-cols-2 gap-4">
            {t.tips.items.map((tip, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E0DDDA] p-5">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <p className="font-medium text-[#1B2A4A] text-sm mb-1">{tip.title}</p>
                <p className="text-xs text-[#6B6560]">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/dashboard"
            className="bg-[#1B2A4A] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#243860] transition">
            {t.cta}
          </Link>
          <Link href="/pricing"
            className="border border-[#E0DDDA] text-[#1B2A4A] px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#F5F4F0] transition">
            {t.pricing}
          </Link>
          <Link href="/help"
            className="border border-[#E0DDDA] text-[#1B2A4A] px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#F5F4F0] transition">
            {t.help}
          </Link>
        </div>
      </div>
    </div>
  )
}