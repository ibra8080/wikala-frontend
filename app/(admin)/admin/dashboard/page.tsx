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
  needs_reexport: number
  in_transit: number
  in_warehouse_egypt: number
  in_warehouse_germany: number
  awaiting_shipment: number
}

interface SalesStats {
  today: { orders: number; units: number; revenue: number }
  month: { orders: number; units: number; revenue: number }
  sellers_payout: { paid: number; pending: number }
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0)

const todayLabel = new Date().toLocaleDateString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric',
})
const monthLabel = new Date().toLocaleDateString('en-GB', {
  month: 'long', year: 'numeric',
})

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-bold text-[#1B2A4A] mb-3">{children}</h2>
)

const StatCard = ({ label, value, sub, href, urgent }: {
  label: string; value: string | number; sub?: string; href: string; urgent?: boolean
}) => {
  const isUrgent = urgent && Number(value) > 0
  return (
    <Link
      href={href}
      className={`flex-1 bg-white rounded-2xl border p-6 hover:border-[#C8952E] transition group
        ${isUrgent ? 'border-[#C8952E]' : 'border-[#E0DDDA]'}`}
    >
      <p className={`text-4xl font-bold font-display
        ${isUrgent ? 'text-[#C8952E]' : 'text-[#1B2A4A]'}`}>
        {value}
      </p>
      <p className="text-sm text-[#6B6560] mt-2 group-hover:text-[#C8952E] transition">
        {label}
      </p>
      {sub && <p className="text-xs text-[#9A938C] mt-1">{sub}</p>}
    </Link>
  )
}

const PayoutCard = ({ paid, pending, href }: {
  paid: number; pending: number; href: string
}) => (
  <Link
    href={href}
    className="flex-1 bg-white rounded-2xl border border-[#E0DDDA] p-6 hover:border-[#C8952E] transition group"
  >
    <div className="flex gap-6">
      <div>
        <p className="text-2xl font-bold font-display text-[#1B2A4A]">{fmtEur(paid)}</p>
        <p className="text-xs text-[#9A938C] mt-1">Paid</p>
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-[#C8952E]">{fmtEur(pending)}</p>
        <p className="text-xs text-[#9A938C] mt-1">Pending</p>
      </div>
    </div>
    <p className="text-sm text-[#6B6560] mt-3 group-hover:text-[#C8952E] transition">
      Sellers Payout (this year)
    </p>
  </Link>
)

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
        needs_reexport: products.filter((p: { status: string; previous_status?: string }) =>
          p.status === 'pending_review' && p.previous_status === 'listed'
        ).length,
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
  const needsAttention = unreadConvs.length + activeIssues.length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Admin Dashboard</h1>
        <p className="text-sm text-[#6B6560] mt-1">Wikala Operations Overview</p>
      </div>

      {/* Sales */}
      <section className="mb-8">
        <SectionTitle>Sales</SectionTitle>
        <div className="flex flex-col md:flex-row gap-4">
          <StatCard label="Today's Orders" value={sales?.today.orders ?? 0} sub={todayLabel} href="/admin/sales" />
          <StatCard label="Today's Sales" value={fmtEur(sales?.today.revenue ?? 0)} sub={todayLabel} href="/admin/sales" />
          <StatCard label="Month Orders" value={sales?.month.orders ?? 0} sub={monthLabel} href="/admin/sales" />
          <StatCard label="Month Sales" value={fmtEur(sales?.month.revenue ?? 0)} sub={monthLabel} href="/admin/sales" />
        </div>
      </section>

      {/* Overview */}
      <section className="mb-8">
        <SectionTitle>Overview</SectionTitle>
        <div className="flex flex-col md:flex-row gap-4">
          <StatCard label="Active Sellers" value={stats?.total_sellers ?? 0} href="/admin/sellers" />
          <StatCard label="Active Products" value={stats?.total_products ?? 0} href="/admin/products" />
          <StatCard label="Site Visitors" value="—" sub="Coming soon" href="/admin/sales" />
          <PayoutCard paid={sales?.sellers_payout.paid ?? 0} pending={sales?.sellers_payout.pending ?? 0} href="/admin/statements" />
        </div>
      </section>

      {/* Needs Action */}
      <section className="mb-8">
        <SectionTitle>Needs Action</SectionTitle>
        <div className="flex flex-col md:flex-row gap-4">
          <StatCard label="Pending Sellers" value={stats?.pending_sellers ?? 0} href="/admin/sellers" urgent />
          <StatCard label="Pending Products" value={stats?.pending_products ?? 0} href="/admin/products" urgent />
          <StatCard label="Need Re-export" value={stats?.needs_reexport ?? 0} href="/admin/products" urgent />
          <StatCard label="Pending Shipments" value={stats?.pending_shipments ?? 0} href="/admin/shipments" urgent />
          <StatCard label="Open Messages & Tickets" value={needsAttention} href="/admin/messages" urgent />
        </div>
      </section>

      {/* Product Journey */}
      <section className="mb-8">
        <SectionTitle>Product Journey</SectionTitle>
        <div className="flex flex-col md:flex-row gap-4">
          <StatCard label="Awaiting Shipment" value={stats?.awaiting_shipment ?? 0} href="/admin/products" />
          <StatCard label="In Egypt Warehouse" value={stats?.in_warehouse_egypt ?? 0} href="/admin/products" />
          <StatCard label="In Transit" value={stats?.in_transit ?? 0} href="/admin/products" />
          <StatCard label="In Germany Warehouse" value={stats?.in_warehouse_germany ?? 0} href="/admin/products" />
        </div>
      </section>
    </div>
  )
}