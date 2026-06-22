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

interface SalesStats {
  today: { orders: number; units: number; revenue: number }
  month: { orders: number; units: number; revenue: number }
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0)

export default function AdminDashboard() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [sales, setSales] = useState<SalesStats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
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
      api.get('/finance/admin/sales/stats/'),
    ]).then(([sellersRes, productsRes, shipmentsRes, convsRes, issuesRes, salesRes]) => {
      const sellers = sellersRes.data
      const products = productsRes.data
      const shipments = shipmentsRes.data

      setConversations(convsRes.data)
      setIssues(issuesRes.data)
      setSales(salesRes.data)

      setStats({
        pending_sellers: sellers.filter((s: { status: string }) => s.status === 'pending').length,
        pending_products: products.filter((p: { status: string }) => p.status === 'pending_review').length,
        pending_shipments: shipments.filter((s: { status: string }) => s.status === 'submitted').length,
        total_sellers: sellers.filter((s: { status: string }) => s.status === 'approved').length,
        total_products: products.filter((p: { status: string }) =>
          ['approved', 'listed', 'awaiting_seller_shipment', 'in_warehouse_egypt', 'in_transit', 'in_warehouse_germany'].includes(p.status)
        ).length,
        in_transit: products.filter((p: { status: string }) => p.status === 'in_transit').length,
        in_warehouse_egypt: products.filter((p: { status: string }) => p.status === 'in_warehouse_egypt').length,
        in_warehouse_germany: products.filter((p: { status: string }) => p.status === 'in_warehouse_germany').length,
        awaiting_shipment: products.filter((p: { status: string }) => p.status === 'awaiting_seller_shipment').length,
      })
    }).finally(() => setLoading(false))
  }, [user, _hasHydrated, router])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const adminId = user?.id ?? -1
  const unreadConvs = conversations.filter(c =>
    c.messages?.some(m => m.sender !== adminId && !m.is_read)
  )
  const activeIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress')

  // ── Card groups ──
  const salesCards = [
    { label: "Today's Orders", value: String(sales?.today.orders ?? 0), href: '/admin/sales' },
    { label: "Today's Revenue", value: fmtEur(sales?.today.revenue ?? 0), href: '/admin/sales' },
    { label: 'Month Orders', value: String(sales?.month.orders ?? 0), href: '/admin/sales' },
    { label: 'Month Revenue', value: fmtEur(sales?.month.revenue ?? 0), href: '/admin/sales' },
  ]

  const actionCards = [
    { label: 'Pending Sellers', value: stats?.pending_sellers ?? 0, href: '/admin/sellers' },
    { label: 'Pending Products', value: stats?.pending_products ?? 0, href: '/admin/products' },
    { label: 'Pending Shipments', value: stats?.pending_shipments ?? 0, href: '/admin/shipments' },
  ]

  const pipelineCards = [
    { label: 'Awaiting Shipment', value: stats?.awaiting_shipment ?? 0, href: '/admin/products' },
    { label: 'In Egypt Warehouse', value: stats?.in_warehouse_egypt ?? 0, href: '/admin/products' },
    { label: 'In Transit', value: stats?.in_transit ?? 0, href: '/admin/products' },
    { label: 'In Germany Warehouse', value: stats?.in_warehouse_germany ?? 0, href: '/admin/products' },
    { label: 'Active Products', value: stats?.total_products ?? 0, href: '/admin/products' },
  ]

  const overviewCards = [
    { label: 'Active Sellers', value: stats?.total_sellers ?? 0, href: '/admin/sellers' },
    { label: 'Unread Messages', value: unreadConvs.length, href: '/admin/messages?tab=conversations' },
    { label: 'Open Tickets', value: activeIssues.length, href: '/admin/messages?tab=issues' },
  ]

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-sm font-semibold text-[#6B6560] uppercase tracking-wide mb-3">{children}</h2>
  )

  const StatCard = ({ label, value, href, urgent }: {
    label: string; value: string | number; href: string; urgent?: boolean
  }) => {
    const isUrgent = urgent && Number(value) > 0
    return (
      <Link
        href={href}
        className={`bg-white rounded-2xl border p-6 hover:border-[#C8952E] transition group
          ${isUrgent ? 'border-[#C8952E]' : 'border-[#E0DDDA]'}`}
      >
        <p className={`text-4xl font-bold font-display
          ${isUrgent ? 'text-[#C8952E]' : 'text-[#1B2A4A]'}`}>
          {value}
        </p>
        <p className="text-sm text-[#6B6560] mt-2 group-hover:text-[#C8952E] transition">
          {label}
        </p>
      </Link>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Admin Dashboard</h1>
        <p className="text-sm text-[#6B6560] mt-1">Wikala Operations Overview</p>
      </div>

      {/* Section 1 — Sales */}
      <section className="mb-8">
        <SectionTitle>💰 Sales</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {salesCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      </section>

      {/* Section 2 — Needs Action */}
      <section className="mb-8">
        <SectionTitle>🔴 Needs Action</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {actionCards.map((c) => <StatCard key={c.label} {...c} urgent />)}
        </div>
      </section>

      {/* Section 3 — Product Pipeline */}
      <section className="mb-8">
        <SectionTitle>📦 Product Pipeline</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {pipelineCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      </section>

      {/* Section 4 — Overview */}
      <section className="mb-8">
        <SectionTitle>👥 Overview</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {overviewCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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