'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    email: '', username: '', password: '', password2: '',
    full_name: '', business_name: '', phone: '',
    whatsapp: '', country: '', city: '',
    exported_before: false, referral_source: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }
    if (form.password !== form.password2) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }
    try {
      await api.post('/users/register/', {
        email: form.email, username: form.username,
        password: form.password, password2: form.password2,
      })
      const loginRes = await api.post('/users/login/', {
        email: form.email, password: form.password,
      })
      const { access, refresh } = loginRes.data
      const meRes = await api.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` }
      })
      setAuth(meRes.data, access, refresh)
      await api.post('/sellers/register/', {
        full_name: form.full_name, business_name: form.business_name,
        phone: form.phone, whatsapp: form.whatsapp,
        country: form.country, city: form.city,
        exported_before: form.exported_before,
        referral_source: form.referral_source,
      })
      router.push('/welcome')
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const data = error.response?.data
      if (data) {
        const firstError = Object.values(data)[0]
        setError(Array.isArray(firstError) ? firstError[0] : 'An error occurred.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition bg-[#FAFAF8]"
  const labelClass = "block text-sm font-medium text-[#1B2A4A] mb-1"

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <Link href="/" className="mb-8">
        <img src="/wikala_Logo.svg" alt="Wikala" className="h-10" />
      </Link>

      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#1B2A4A]">Create Seller Account</h1>
          <p className="text-[#6B6560] mt-1 text-sm">Join Wikala and start selling in Europe</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all ${step >= s ? 'bg-[#C8952E]' : 'bg-[#E0DDDA]'}`} />
              <p className="text-xs text-[#6B6560] mt-1">
                {s === 1 ? 'Account Details' : 'Business Info'}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} placeholder="your@email.com" />
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input name="username" value={form.username} onChange={handleChange} required className={inputClass} placeholder="username" />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className={inputClass} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelClass}>Confirm Password</label>
                <input name="password2" type="password" value={form.password2} onChange={handleChange} required className={inputClass} placeholder="••••••••" />
              </div>
              <button type="button" onClick={() => setStep(2)}
                disabled={!form.email || !form.username || !form.password || !form.password2}
                className="w-full bg-[#1B2A4A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition">
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required className={inputClass} placeholder="Your full name" />
              </div>
              <div>
                <label className={labelClass}>Business Name</label>
                <input name="business_name" value={form.business_name} onChange={handleChange} required className={inputClass} placeholder="Your business name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Country</label>
                  <input name="country" value={form.country} onChange={handleChange} required className={inputClass} placeholder="Egypt" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input name="city" value={form.city} onChange={handleChange} required className={inputClass} placeholder="Cairo" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} required className={inputClass} placeholder="+20..." />
              </div>
              <div>
                <label className={labelClass}>How did you hear about us?</label>
                <select name="referral_source" value={form.referral_source} onChange={handleChange} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="friend">Friend</option>
                  <option value="group">Group</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep(1); setError('') }}
                  className="flex-1 border border-[#E0DDDA] text-[#6B6560] rounded-lg py-2.5 text-sm font-medium hover:bg-[#F5F4F0] transition">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#C8952E] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-[#6B6560] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C8952E] font-medium hover:underline">Sign in</Link>
        </p>
      </div>

      <p className="text-xs text-[#6B6560] mt-6">
        <Link href="/pricing" className="hover:underline">Pricing</Link>
        {' · '}
        <Link href="/help" className="hover:underline">Help Center</Link>
      </p>
    </div>
  )
}