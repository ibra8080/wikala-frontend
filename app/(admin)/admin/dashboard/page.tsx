'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Conversation {
  id: number; subject: string; seller: number
  seller_name?: string
  messages: { sender: number; is_read: boolean }[]
}

interface Issue {
  id: number; issue_number: string; title: string; status: string
}

interface Stats {
  pending_sellers: number
  pending_products: number
  pending_shipments: number
  total_sellers: number
  total_products: number
  in_transit: number
  in_warehouse_egypt: number
  in_warehouse_germany: number
  awaiting_shipment: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [issues, setIssues]               = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }

    Promise.all([
      api.get('/sellers/admin/list/'),
      api.get('/products/admin/list/'),
      api.get('/inventory/admin/shipment-requests/'),
      api.get('/communication/conversations/'),
      api.get('/communication/issues/'),
    ]).then(([sellersRes, productsRes, shipmentsRes, convsRes, issuesRes]) => {
      const sellers = sellersRes.data
      const products = productsRes.data
      const shipments = shipmentsRes.data

      setConversations(convsRes.data)
      setIssues(issuesRes.data)

      setStats({
        pending_sellers: sellers.filter((s: { status: string }) => s.status === 'pending').length,
        pending_products: products.filter((p: { status: string }) => p.status === 'pending_review').length,
        pending_shipments: shipments.filter((s: { status: string }) => s.status === 'submitted').length,
        total_sellers: sellers.filter((s: { status: string }) => s.status === 'approved').length,
        total_products: products.filter((p: { status: string }) => p.status === 'listed').length,
        in_transit: products.filter((p: { status: string }) => p.status === 'in_transit').length,
        in_warehouse_egypt: products.filter((p: { status: string }) => p.status === 'in_warehouse_egypt').length,
        in_warehouse_germany: products.filter((p: { status: string }) => p.status === 'in_warehouse_germany').length,
        awaiting_shipment: products.filter((p: { status: string }) => p.status === 'awaiting_seller_shipment').length,
      })
    }).finally(() => setLoading(false))
  }, [user, router])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cards = [
    { label: 'Pending Sellers', value: stats?.pending_sellers ?? 0, href: '/admin/sellers', urgent: true },
    { label: 'Pending Products', value: stats?.pending_products ?? 0, href: '/admin/products', urgent: true },
    { label: 'Pending Shipments', value: stats?.pending_shipments ?? 0, href: '/admin/shipments', urgent: true },
    { label: 'Awaiting Shipment', value: stats?.awaiting_shipment ?? 0, href: '/admin/products', urgent: false },
    { label: 'In Egypt Warehouse', value: stats?.in_warehouse_egypt ?? 0, href: '/admin/products', urgent: false },
    { label: 'In Transit', value: stats?.in_transit ?? 0, href: '/admin/products', urgent: false },
    { label: 'In Germany Warehouse', value: stats?.in_warehouse_germany ?? 0, href: '/admin/products', urgent: false },
    { label: 'Active Sellers', value: stats?.total_sellers ?? 0, href: '/admin/sellers', urgent: false },
    { label: 'Listed Products', value: stats?.total_products ?? 0, href: '/admin/products', urgent: false },
  ]

  const adminId      = user?.id ?? -1
  const unreadConvs  = conversations.filter(c =>
    c.messages?.some(m => m.sender !== adminId && !m.is_read)
  )
  const activeIssues     = issues.filter(i => i.status === 'open' || i.status === 'in_progress')
  const firstUnreadConv  = unreadConvs[0]
  const firstActiveIssue = activeIssues[0]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Admin Dashboard</h1>
        <p className="text-sm text-[#6B6560] mt-1">Wikala Operations Overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`bg-white rounded-2xl border p-6 hover:border-[#C8952E] transition group
              ${card.urgent && card.value > 0 ? 'border-[#C8952E]' : 'border-[#E0DDDA]'}`}
          >
            <p className={`text-3xl font-bold font-display
              ${card.urgent && card.value > 0 ? 'text-[#C8952E]' : 'text-[#1B2A4A]'}`}>
              {card.value}
            </p>
            <p className="text-sm text-[#6B6560] mt-1 group-hover:text-[#C8952E] transition">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/admin/messages?tab=conversations"
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
            {unreadConvs.length > 0 ? 'Unread Messages' : 'No new messages'}
          </p>
        </Link>

        <Link href="/admin/messages?tab=issues"
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

      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Review Seller Applications', href: '/admin/sellers', desc: 'Approve or reject new seller registrations' },
          { label: 'Review Products', href: '/admin/products', desc: 'Approve or reject submitted products' },
          { label: 'Manage Shipment Requests', href: '/admin/shipments', desc: 'Accept shipment requests and set delivery details' },
          { label: 'Manage Statements', href: '/admin/statements', desc: 'Create and send monthly seller statements' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-white rounded-2xl border border-[#E0DDDA] p-6 hover:border-[#C8952E] transition group"
          >
            <p className="font-semibold text-[#1B2A4A] group-hover:text-[#C8952E] transition">
              {action.label}
            </p>
            <p className="text-sm text-[#6B6560] mt-1">{action.desc}</p>
            <p className="text-[#C8952E] mt-3 text-sm">Go →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}