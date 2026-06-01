'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    full_name: '',
    business_name: '',
    phone: '',
    whatsapp: '',
    country: '',
    city: '',
    exported_before: false,
    referral_source: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/users/register/', {
        email: form.email,
        username: form.username,
        password: form.password,
        password2: form.password2,
      })
      const loginRes = await api.post('/users/login/', {
        email: form.email,
        password: form.password,
      })
      await api.post('/sellers/register/', {
        full_name: form.full_name,
        business_name: form.business_name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        country: form.country,
        city: form.city,
        exported_before: form.exported_before,
        referral_source: form.referral_source,
      }, {
        headers: { Authorization: `Bearer ${loginRes.data.access}` }
      })
      router.push('/welcome')
    } catch (err: unknown) {
    const error = err as { response?: { data?: { email?: string[] } } }
    setError(error.response?.data?.email?.[0] || 'حدث خطأ، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">وكالة</h1>
          <p className="text-gray-500 mt-1 text-sm">إنشاء حساب بائع جديد</p>
        </div>

        <div className="flex mb-8 gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-gray-900' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                <input name="username" value={form.username} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
                <input name="password2" type="password" value={form.password2} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <button type="button" onClick={() => setStep(2)}
                className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition">
                التالي
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم النشاط التجاري</label>
                <input name="business_name" value={form.business_name} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الدولة</label>
                  <input name="country" value={form.country} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <input name="city" value={form.city} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input name="phone" value={form.phone} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كيف عرفت عنا؟</label>
                <select name="referral_source" value={form.referral_source} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="">اختر...</option>
                  <option value="facebook">فيسبوك</option>
                  <option value="instagram">إنستغرام</option>
                  <option value="friend">صديق</option>
                  <option value="group">مجموعة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">
                  السابق
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition">
                  {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب؟{' '}
          <a href="/login" className="text-gray-900 font-medium hover:underline">سجّل دخولك</a>
        </p>
      </div>
    </div>
  )
}