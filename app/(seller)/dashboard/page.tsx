'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Conversation {
  id: number; subject: string
  messages: { sender: number; is_read: boolean }[]
}

interface Issue {
  id: number; issue_number: string; title: string; status: string
}

interface Profile {
  full_name: string
  business_name: string
  seller_id: string
  status: string
}

export default function SellerDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [issues, setIssues]               = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'seller') { router.push('/admin/dashboard'); return }
    Promise.all([
      api.get('/sellers/profile/'),
      api.get('/communication/conversations/'),
      api.get('/communication/issues/'),
    ]).then(([profileRes, convsRes, issuesRes]) => {
      setProfile(profileRes.data)
      setConversations(convsRes.data)
      setIssues(issuesRes.data)
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
    suspended: { label: 'Suspended', color: 'bg-gray-50 text-gray-500 border-gray-200' },
  }

  const status = statusMap[profile?.status ?? 'pending'] ?? statusMap.pending

  const sellerId     = user?.id ?? -1
  const unreadConvs  = conversations.filter(c =>
    c.messages?.some(m => m.sender !== sellerId && !m.is_read)
  )
  const activeIssues     = issues.filter(i => i.status === 'open' || i.status === 'in_progress')
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display">
          Welcome, {profile?.full_name} 👋
        </h1>
        <p className="text-[#6B6560] text-sm mt-1">{profile?.business_name}</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B6560] uppercase tracking-wide mb-2">
              Account Status
            </p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${status.color}`}>
              {status.label}
            </span>
            {profile?.status === 'pending' && (
              <p className="text-xs text-[#6B6560] mt-2">
                Your application will be reviewed within 3–5 business days.
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-[#6B6560] uppercase tracking-wide mb-2">
              Seller ID
            </p>
            <p className="text-xl font-mono font-bold text-[#1B2A4A]">
              {profile?.seller_id || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link href="/messages"
          className="bg-white rounded-2xl border border-[#E0DDDA] p-5 hover:bg-[#FFF8EE] transition group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${unreadConvs.length > 0 ? 'text-[#C8952E]' : 'text-[#1B2A4A]'}`}>
                {unreadConvs.length}
              </span>
              {unreadConvs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#C8952E] text-white">New</span>
              )}
            </div>
            <span className="text-[#C8952E] group-hover:translate-x-1 transition">→</span>
          </div>
          <p className="text-sm font-semibold text-[#1B2A4A]">
            {unreadConvs.length > 0 ? 'New Messages from Wikala' : 'No new messages'}
          </p>
        </Link>

        <Link href="/messages"
          className="bg-white rounded-2xl border border-[#E0DDDA] p-5 hover:bg-[#FFF8EE] transition group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${activeIssues.length > 0 ? 'text-[#C8952E]' : 'text-[#1B2A4A]'}`}>
                {activeIssues.length}
              </span>
              {activeIssues.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#C8952E] text-white">New</span>
              )}
            </div>
            <span className="text-[#C8952E] group-hover:translate-x-1 transition">→</span>
          </div>
          <p className="text-sm font-semibold text-[#1B2A4A]">
            {activeIssues.length > 0 ? 'Open Support Tickets' : 'No open tickets'}
          </p>
        </Link>
      </div>

      {/* Stats */}
      {profile?.status === 'approved' && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Products', value: '0', href: '/products' },
            { label: 'Total Sales', value: '€0', href: '/statements' },
            { label: 'Inventory', value: '0', href: '/inventory' },
          ].map((stat) => (
            <a
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-2xl border border-[#E0DDDA] p-6 hover:border-[#C8952E] transition group"
            >
              <p className="text-2xl font-bold text-[#1B2A4A] font-display">
                {stat.value}
              </p>
              <p className="text-sm text-[#6B6560] mt-1 group-hover:text-[#C8952E] transition">
                {stat.label}
              </p>
            </a>
          ))}
        </div>
      )}

      {/* Quick Links */}
      {profile?.status === 'approved' && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4 font-display">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add New Product', href: '/products/new' },
              { label: 'View Statements', href: '/statements' },
              { label: 'Track Shipments', href: '/inventory' },
              { label: 'Contact Wikala', href: '/messages' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center justify-between p-4 border border-[#E0DDDA] rounded-xl hover:border-[#C8952E] hover:bg-[#F5F4F0] transition group"
              >
                <span className="text-sm text-[#1B2A4A]">{link.label}</span>
                <span className="text-[#C8952E] group-hover:translate-x-1 transition">→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}