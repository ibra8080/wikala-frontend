'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'
import api from '@/lib/axios'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/users/login/', { email, password })
      const { access, refresh } = res.data
      const meRes = await api.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` },
      })
      setAuth(meRes.data, access, refresh)
      if (meRes.data.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        // Show mobile warning on small screens
        if (window.innerWidth < 1024) {
          setShowMobileWarning(true)
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4">

      {/* Mobile Warning Popup */}
      {showMobileWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
            <div className="text-4xl mb-4">💻</div>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">
              Best Viewed on Desktop
            </h2>
            <p className="text-sm text-[#6B6560] leading-relaxed mb-6">
              The Wikala Seller Portal is designed for desktop use. Some features and details may not display correctly on mobile screens. For the best experience, please access the platform from a computer or laptop.
            </p>
            <p className="text-xs text-[#6B6560] mb-6 bg-[#F5F4F0] rounded-xl px-4 py-3">
              منصة البائعين مصممة للاستخدام على الحاسوب. للحصول على أفضل تجربة، يُرجى الوصول إليها من جهاز كمبيوتر أو لابتوب.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-[#1B2A4A] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
                Continue Anyway
              </button>
              <button
                onClick={() => setShowMobileWarning(false)}
                className="flex-1 border border-[#E0DDDA] text-[#6B6560] py-2.5 rounded-lg text-sm font-medium hover:bg-[#F5F4F0] transition">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logo */}
      <Link href="/" className="mb-8">
        <img src="/wikala_Logo.svg" alt="Wikala" className="h-10" />
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#1B2A4A]">Welcome back</h1>
          <p className="text-[#6B6560] mt-1 text-sm">Sign in to your seller account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1B2A4A] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition bg-[#FAFAF8]"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B2A4A] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition bg-[#FAFAF8]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B2A4A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B6560] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#C8952E] font-medium hover:underline">
            Register now
          </Link>
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