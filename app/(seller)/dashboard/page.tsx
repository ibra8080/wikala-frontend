'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

export default function SellerDashboard() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'seller') { router.push('/admin/dashboard'); return }
    api.get('/sellers/profile/')
      .then(res => setProfile(res.data))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'قيد المراجعة', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    approved: { label: 'معتمد', color: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-200' },
    suspended: { label: 'موقوف', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  }

  const status = statusMap[profile?.status] || statusMap.pending

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-900">وكالة</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button onClick={() => { clearAuth(); router.push('/login') }}
            className="text-sm text-gray-500 hover:text-gray-900">
            خروج
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            مرحباً، {profile?.full_name} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">{profile?.business_name}</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">حالة الحساب</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${status.color}`}>
                {status.label}
              </span>
              {profile?.status === 'pending' && (
                <p className="text-xs text-gray-400 mt-2">
                  سيتم مراجعة طلبك خلال 3-5 أيام عمل
                </p>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 mb-1">رقم البائع</p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {profile?.seller_id || '---'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {profile?.status === 'approved' && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'المنتجات', value: '0', href: '/seller/products' },
              { label: 'المبيعات', value: '€0', href: '/seller/statements' },
              { label: 'المخزون', value: '0', href: '/seller/inventory' },
            ].map((stat) => (
              <a key={stat.label} href={stat.href}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-300 transition cursor-pointer">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </a>
            ))}
          </div>
        )}

        {/* Quick Links */}
        {profile?.status === 'approved' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">روابط سريعة</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'إضافة منتج جديد', href: '/seller/products/new' },
                { label: 'كشف الحساب', href: '/seller/statements' },
                { label: 'متابعة الشحن', href: '/seller/inventory' },
                { label: 'التواصل مع وكالة', href: '/seller/messages' },
              ].map((link) => (
                <a key={link.label} href={link.href}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                  <span className="text-sm text-gray-700">{link.label}</span>
                  <span className="text-gray-400">←</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}