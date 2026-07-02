'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/axios'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const uid = params.get('uid') || ''
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Not entirely numbers', ok: password.length > 0 && !/^\d+$/.test(password) },
    { label: 'Passwords match', ok: password.length > 0 && password === password2 },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password2) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/users/password-reset-confirm/', {
        uid,
        token,
        password,
        password2,
      })
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: Record<string, string[] | string> } })
          ?.response?.data
      const msg =
        (detail?.token as string) ||
        (detail?.uid as string) ||
        (Array.isArray(detail?.password) ? detail.password[0] : detail?.password as string) ||
        (Array.isArray(detail?.password2) ? detail.password2[0] : detail?.password2 as string) ||
        'This reset link is invalid or has expired. Please request a new one.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!uid || !token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-500">
          Invalid reset link. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-gray-900 font-medium hover:underline"
        >
          Request new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-700">
          Your password has been reset successfully. Redirecting to login...
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-gray-900 font-medium hover:underline"
        >
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New password
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 px-3 text-xs text-gray-500 hover:text-gray-900"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm new password
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="••••••••"
          />
        </div>
      </div>

      <ul className="space-y-1">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`text-xs flex items-center gap-1.5 transition-colors ${
              c.ok ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span>{c.ok ? '✓' : '○'}</span>
            {c.label}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-400">
        Very common passwords will be rejected.
      </p>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition"
      >
        {loading ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Wikala</h1>
          <p className="text-gray-500 mt-1 text-sm">Set a new password</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-gray-500">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
