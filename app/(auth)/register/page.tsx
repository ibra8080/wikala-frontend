'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'

// --- Types ---
type FieldErrors = Record<string, string>

// --- Helpers ---
function parseApiErrors(data: Record<string, string[]>): FieldErrors {
  const out: FieldErrors = {}
  const labels: Record<string, string> = {
    email: 'Email',
    username: 'Username',
    password: 'Password',
    password2: 'Confirm password',
    business_name: 'Business name',
    full_name: 'Full name',
    phone: 'Phone',
    non_field_errors: 'Error',
  }
  for (const [field, msgs] of Object.entries(data)) {
    out[field] = `${labels[field] ?? field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`
  }
  return out
}

function validateStep1(form: {
  email: string; username: string; password: string; password2: string
}): FieldErrors {
  const errs: FieldErrors = {}
  if (!form.email) errs.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.'
  if (!form.username) errs.username = 'Username is required.'
  else if (form.username.length < 3) errs.username = 'Username must be at least 3 characters.'
  else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = 'Username: letters, numbers, and underscores only.'
  if (!form.password) errs.password = 'Password is required.'
  else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
  if (!form.password2) errs.password2 = 'Please confirm your password.'
  else if (form.password !== form.password2) errs.password2 = 'Passwords do not match.'
  return errs
}

function validateStep2(form: {
  full_name: string; business_name: string; country: string; city: string; phone: string
}): FieldErrors {
  const errs: FieldErrors = {}
  if (!form.full_name.trim()) errs.full_name = 'Full name is required.'
  if (!form.business_name.trim()) errs.business_name = 'Business name is required.'
  if (!form.country.trim()) errs.country = 'Country is required.'
  if (!form.city.trim()) errs.city = 'City is required.'
  if (!form.phone.trim()) errs.phone = 'Phone number is required.'
  return errs
}

// --- Component ---
export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    email: '', username: '', password: '', password2: '',
    full_name: '', business_name: '', phone: '', whatsapp: '',
    country: '', city: '', exported_before: false, referral_source: '',
  })

  // touched fields (for inline validation on blur)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  // show/hide password
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  // submission-level error
  const [submitError, setSubmitError] = useState('')

  const fieldErrors = useMemo<FieldErrors>(() => {
    const allErrs = { ...validateStep1(form), ...validateStep2(form) }
    const visible: FieldErrors = {}
    for (const key of Object.keys(touched)) {
      if (allErrs[key]) visible[key] = allErrs[key]
    }
    return visible
  }, [form, touched])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  // Step 1 → validate locally + check uniqueness on server
  const handleNext = async () => {
    // Touch all step 1 fields
    setTouched(prev => ({ ...prev, email: true, username: true, password: true, password2: true }))
    const errs = validateStep1(form)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    setSubmitError('')
    try {
      await api.post('/users/validate/', { email: form.email, username: form.username })
      setStep(2)
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string | string[]> } }
      if (e.response?.data) {
        const label: Record<string, string> = { email: 'Email', username: 'Username' }
        const msgs = Object.entries(e.response.data)
          .map(([field, msg]) => `${label[field] ?? field}: ${Array.isArray(msg) ? msg.join(' ') : msg}`)
          .join(' | ')
        setSubmitError(msgs)
      } else {
        setSubmitError('Connection error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Final submit — register user + seller in sequence
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(prev => ({
      ...prev, full_name: true, business_name: true,
      country: true, city: true, phone: true,
    }))
    const errs = validateStep2(form)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    setSubmitError('')
    try {
      // Validate all unique fields BEFORE creating anything
      await api.post('/users/validate/', {
        email: form.email,
        username: form.username,
        business_name: form.business_name,
      })

      // 1. Create user
      await api.post('/users/register/', {
        email: form.email,
        username: form.username,
        password: form.password,
        password2: form.password2,
      })
      // 2. Login to get token
      const loginRes = await api.post('/users/login/', {
        email: form.email,
        password: form.password,
      })
      // 3. Create seller profile
      await api.post('/sellers/register/', {
        full_name: form.full_name,
        business_name: form.business_name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        country: form.country,
        city: form.city,
        exported_before: form.exported_before,
        referral_source: form.referral_source,
      }, { headers: { Authorization: `Bearer ${loginRes.data.access}` } })

      // Store tokens + auto-login
      const { access, refresh } = loginRes.data
      const meRes = await api.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` },
      })
      const { setAuth } = useAuthStore.getState()
      setAuth(meRes.data, access, refresh)
      router.push('/welcome')
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      if (e.response?.data) {
        setSubmitError(Object.values(parseApiErrors(e.response.data)).join(' | '))
      } else {
        setSubmitError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition ${
      fieldErrors[field]
        ? 'border-red-400 focus:border-red-500'
        : 'border-[#E0DDDA] focus:border-[#1B2A4A]'
    }`

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E0DDDA] p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Create Seller Account</h1>
          <p className="text-[#6B6560] mt-1 text-sm">Join Wikala and start selling in Europe</p>
        </div>

        {/* Step indicator */}
        <div className="flex mb-8 gap-3 items-center">
          {['Account Details', 'Business Info'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full mb-1.5 ${step > i ? 'bg-[#C8952E]' : step === i + 1 ? 'bg-[#1B2A4A]' : 'bg-[#E0DDDA]'}`} />
              <span className={`text-xs ${step === i + 1 ? 'text-[#1B2A4A] font-medium' : 'text-[#6B6560]'}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Email Address</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="you@example.com"
                className={inputClass('email')} />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Username</label>
              <input name="username" value={form.username}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. cairo_crafts"
                className={inputClass('username')} />
              {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
            </div>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Min. 8 characters"
                  className={inputClass('password') + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1B2A4A] text-xs">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input name="password2" type={showPass2 ? 'text' : 'password'} value={form.password2}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Repeat your password"
                  className={inputClass('password2') + ' pr-10'} />
                <button type="button" onClick={() => setShowPass2(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1B2A4A] text-xs">
                  {showPass2 ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password2 && <p className="text-red-500 text-xs mt-1">{fieldErrors.password2}</p>}
            </div>

            {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}

            <button type="button" onClick={handleNext} disabled={loading}
              className="w-full bg-[#1B2A4A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition">
              {loading ? 'Checking...' : 'Next →'}
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Full Name</label>
              <input name="full_name" value={form.full_name}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Your full name"
                className={inputClass('full_name')} />
              {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
            </div>
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Business Name</label>
              <input name="business_name" value={form.business_name}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Your brand or shop name"
                className={inputClass('business_name')} />
              {fieldErrors.business_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.business_name}</p>}
            </div>
            {/* Country + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Country</label>
                <input name="country" value={form.country}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. Egypt"
                  className={inputClass('country')} />
                {fieldErrors.country && <p className="text-red-500 text-xs mt-1">{fieldErrors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">City</label>
                <input name="city" value={form.city}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. Cairo"
                  className={inputClass('city')} />
                {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
              </div>
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Phone Number</label>
              <input name="phone" value={form.phone}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="+20 100 000 0000"
                className={inputClass('phone')} />
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>
            {/* How did you hear */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">How did you hear about us?</label>
              <select name="referral_source" value={form.referral_source}
                onChange={handleChange} onBlur={handleBlur}
                className={inputClass('referral_source')}>
                <option value="">Select...</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="friend">Friend</option>
                <option value="group">Group</option>
                <option value="other">Other</option>
              </select>
            </div>

            {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 border border-[#E0DDDA] text-[#1B2A4A] rounded-lg py-2.5 text-sm font-medium hover:bg-[#F5F4F0] transition">
                ← Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-[#C8952E] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#b07d26] disabled:opacity-50 transition">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-[#6B6560] mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-[#1B2A4A] font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}