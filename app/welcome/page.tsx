'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

const content = {
  en: {
    title: 'Welcome to Wikala!',
    subtitle: 'Your seller account has been created. Here\'s what happens next:',
    steps: [
      { num: '01', status: 'done', title: 'Account Created ✓', desc: 'Your account is created and under review. Our team will verify your details within 3–5 business days.' },
      { num: '02', status: 'pending', title: 'Complete Registration Fee', desc: 'Choose a payment method below to complete your registration.' },
      { num: '03', status: 'pending', title: 'Get Approved', desc: 'Once payment is confirmed and details verified, you\'ll receive your unique Seller ID.' },
      { num: '04', status: 'pending', title: 'Add Your Products', desc: 'Register your products with photos, descriptions, dimensions, and pricing.' },
      { num: '05', status: 'pending', title: 'Ship to Germany', desc: 'Create a shipment request and send your products to our warehouse in Germany.' },
      { num: '06', status: 'pending', title: 'Start Earning', desc: 'Your products go live on our store. You receive monthly statements with your earnings.' },
    ],
    payment: {
      title: 'Registration Fee',
      amount: '€39.90',
      subtitle: 'Choose your preferred payment method to complete registration:',
      bank: {
        title: 'Bank Transfer',
        desc: 'Transfer to our account and send the receipt to our email.',
        details: [
          { label: 'Account Name', value: 'Wikala GmbH' },
          { label: 'IBAN', value: 'DE89 3704 0044 0532 0130 00' },
          { label: 'Bank', value: 'Commerzbank' },
          { label: 'BIC', value: 'COBADEFFXXX' },
        ],
      },
      instapay: {
        title: 'InstaPay',
        desc: 'Send via InstaPay and share the receipt with us.',
        number: '+201018417838',
      },
      proof: 'After payment, send the receipt to:',
      email: 'info@wikala.net',
      proofNote: 'Please include your registered email in the subject line.',
      code: {
        title: 'Have a special code?',
        placeholder: 'Enter code...',
        apply: 'Apply',
      },
    },
    tips: {
      title: 'While You Wait',
      items: [
        { icon: '📋', title: 'Complete your profile', desc: 'Make sure all your business details are accurate.', href: '/dashboard' },
        { icon: '📸', title: 'Prepare product photos', desc: 'High-quality images on white background work best.', href: '/help#products' },
        { icon: '📏', title: 'Measure your products', desc: 'Have dimensions and weights ready for each product.', href: '/help#products' },
        { icon: '💰', title: 'Review pricing', desc: 'Check our pricing page to understand all costs.', href: '/pricing' },
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
      { num: '01', status: 'done', title: 'تم إنشاء الحساب ✓', desc: 'تم إنشاء حسابك وهو قيد المراجعة. سيتحقق فريقنا من بياناتك خلال 3–5 أيام عمل.' },
      { num: '02', status: 'pending', title: 'أكمل رسوم التسجيل', desc: 'اختر طريقة الدفع أدناه لإكمال تسجيلك.' },
      { num: '03', status: 'pending', title: 'الحصول على الموافقة', desc: 'بعد تأكيد الدفع والتحقق من البيانات، ستحصل على معرف البائع الخاص بك.' },
      { num: '04', status: 'pending', title: 'أضف منتجاتك', desc: 'سجّل منتجاتك مع الصور والأوصاف والأبعاد والتسعير.' },
      { num: '05', status: 'pending', title: 'اشحن إلى ألمانيا', desc: 'أنشئ طلب شحن وأرسل منتجاتك إلى مستودعنا في ألمانيا.' },
      { num: '06', status: 'pending', title: 'ابدأ الربح', desc: 'تظهر منتجاتك على متجرنا. تحصل على كشوف حساب شهرية بأرباحك.' },
    ],
    payment: {
      title: 'رسوم التسجيل',
      amount: '٣٩٫٩٠ يورو',
      subtitle: 'اختر طريقة الدفع المفضلة لإكمال التسجيل:',
      bank: {
        title: 'تحويل بنكي',
        desc: 'حوّل إلى حسابنا وأرسل الإيصال على إيميلنا.',
        details: [
          { label: 'اسم الحساب', value: 'Wikala GmbH' },
          { label: 'IBAN', value: 'DE89 3704 0044 0532 0130 00' },
          { label: 'البنك', value: 'Commerzbank' },
          { label: 'BIC', value: 'COBADEFFXXX' },
        ],
      },
      instapay: {
        title: 'إنستاباي',
        desc: 'أرسل عبر إنستاباي وشاركنا الإيصال.',
        number: '+201018417838',
      },
      proof: 'بعد الدفع، أرسل الإيصال إلى:',
      email: 'info@wikala.net',
      proofNote: 'يرجى كتابة إيميل التسجيل في عنوان الرسالة.',
      code: {
        title: 'عندك كود خاص؟',
        placeholder: 'أدخل الكود...',
        apply: 'تطبيق',
      },
    },
    tips: {
      title: 'في انتظار الموافقة',
      items: [
        { icon: '📋', title: 'أكمل ملفك الشخصي', desc: 'تأكد من دقة جميع بيانات نشاطك التجاري.', href: '/dashboard' },
        { icon: '📸', title: 'جهّز صور المنتجات', desc: 'الصور عالية الجودة على خلفية بيضاء هي الأفضل.', href: '/help#products' },
        { icon: '📏', title: 'قِس منتجاتك', desc: 'احتفظ بالأبعاد والأوزان جاهزة لكل منتج.', href: '/help#products' },
        { icon: '💰', title: 'راجع التسعير', desc: 'تحقق من صفحة التسعير لفهم جميع التكاليف.', href: '/pricing' },
      ]
    },
    cta: 'اذهب إلى لوحة التحكم',
    pricing: 'مراجعة التسعير',
    help: 'مركز المساعدة',
  }
}

export default function WelcomePage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const { user, _hasHydrated } = useAuthStore()
  const t = content[lang]
  const isAr = lang === 'ar'

  const [codeInput, setCodeInput] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeResult, setCodeResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return
    setCodeLoading(true)
    setCodeResult(null)
    try {
      const res = await api.post('/finance/codes/apply/', { code: codeInput.trim() })
      const { discount_type, value } = res.data
      const discountText = discount_type === 'percent' ? `${value}%` : `€${value}`
      setCodeResult({
        type: 'success',
        text: lang === 'en'
          ? `Code applied! You get ${discountText} discount on your registration fee.`
          : `تم تطبيق الكود! حصلت على خصم ${discountText} على رسوم التسجيل.`
      })
    } catch {
      setCodeResult({
        type: 'error',
        text: lang === 'en' ? 'Invalid or expired code.' : 'كود غير صالح أو منتهي الصلاحية.'
      })
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Navbar */}
      <nav className="bg-[#FAFAF8] border-b border-[#E0DDDA]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/wikala_Logo.svg" alt="Wikala" className="h-8" />
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-xs border border-[#E0DDDA] px-3 py-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F4F0] transition">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">{t.title}</h1>
          {user && <p className="text-[#C8952E] font-medium mb-1">{user.email}</p>}
          <p className="text-sm text-[#6B6560]">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

          {/* Left: Steps + Tips + CTAs */}
          <div>
            {/* Steps */}
            <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden mb-6">
              {t.steps.map((step, i) => (
                <div key={i}
                  className={`flex items-start gap-4 px-6 py-4 border-b border-[#E0DDDA] last:border-0
                    ${step.status === 'done' ? 'bg-green-50' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                    ${step.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-[#F5F4F0] text-[#6B6560]'}`}>
                    {step.status === 'done' ? '✓' : step.num}
                  </div>
                  <div>
                    <p className={`font-semibold mb-0.5 ${step.status === 'done' ? 'text-green-700' : 'text-[#1B2A4A]'}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-[#6B6560] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="mb-6">
              <h2 className="font-semibold text-[#1B2A4A] mb-3">{t.tips.title}</h2>
              <div className="grid grid-cols-2 gap-3">
                {t.tips.items.map((tip, i) => (
                  <Link key={i} href={tip.href}
                    className="bg-white rounded-2xl border border-[#E0DDDA] p-4 hover:border-[#C8952E] transition group">
                    <div className="text-2xl mb-2">{tip.icon}</div>
                    <p className="font-medium text-[#1B2A4A] text-sm mb-1 group-hover:text-[#C8952E] transition">{tip.title}</p>
                    <p className="text-xs text-[#6B6560]">{tip.desc}</p>
                  </Link>
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

          {/* Right: Payment — sticky */}
          <div className="sticky top-4">
            <div className="bg-white rounded-2xl border-2 border-[#C8952E]/30 overflow-hidden">
              <div className="bg-[#C8952E]/5 px-6 py-4 border-b border-[#C8952E]/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1B2A4A]">{t.payment.title}</h2>
                  <span className="text-2xl font-bold text-[#C8952E]">
                    {codeResult?.type === 'success'
                      ? <><s className="text-[#6B6560] text-lg">{t.payment.amount}</s> <span className="text-green-600">€0.00</span></>
                      : t.payment.amount}
                  </span>
                </div>
                <p className="text-sm text-[#6B6560] mt-1">{t.payment.subtitle}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Bank Transfer */}
                <div className="bg-[#F5F4F0] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏦</span>
                    <h3 className="font-semibold text-[#1B2A4A] text-sm">{t.payment.bank.title}</h3>
                  </div>
                  <p className="text-xs text-[#6B6560] mb-2">{t.payment.bank.desc}</p>
                  <div className="space-y-1.5">
                    {t.payment.bank.details.map((d, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <span className="text-[#6B6560] w-28 flex-shrink-0">{d.label}</span>
                        <span className="text-[#1B2A4A] font-mono font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* InstaPay */}
                <div className="bg-[#F5F4F0] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📱</span>
                    <h3 className="font-semibold text-[#1B2A4A] text-sm">{t.payment.instapay.title}</h3>
                  </div>
                  <p className="text-xs text-[#6B6560] mb-1">{t.payment.instapay.desc}</p>
                  <p className="font-mono font-medium text-[#1B2A4A]">{t.payment.instapay.number}</p>
                </div>

                {/* Send Proof */}
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-blue-700 mb-1">{t.payment.proof}</p>
                  <a href={`mailto:${t.payment.email}`}
                    className="font-bold text-blue-800 hover:underline text-sm">
                    {t.payment.email}
                  </a>
                  <p className="text-xs text-blue-600 mt-1">{t.payment.proofNote}</p>
                </div>

                {/* Discount Code */}
                <div className="border-t border-[#E0DDDA] pt-4">
                  <h3 className="font-semibold text-[#1B2A4A] mb-2 text-sm">{t.payment.code.title}</h3>
                  <div className="flex gap-2">
                    <input
                      value={codeInput}
                      onChange={e => setCodeInput(e.target.value.toUpperCase())}
                      placeholder={t.payment.code.placeholder}
                      className="flex-1 border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C8952E] transition uppercase"
                    />
                    <button
                      onClick={handleApplyCode}
                      disabled={codeLoading || !codeInput.trim()}
                      className="bg-[#C8952E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-40 transition">
                      {codeLoading ? '...' : t.payment.code.apply}
                    </button>
                  </div>
                  {codeResult && (
                    <p className={`text-xs mt-2 ${codeResult.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                      {codeResult.type === 'success' ? '✓' : '✗'} {codeResult.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}