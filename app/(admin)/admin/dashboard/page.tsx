'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Stats {
  pending_sellers: number
  pending_products: number
  pending_shipments: number
  total_sellers: number
  total_products: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }

    Promise.all([
      api.get('/sellers/admin/list/'),
      api.get('/products/admin/list/'),
      api.get('/inventory/admin/shipment-requests/'),
    ]).then(([sellersRes, productsRes, shipmentsRes]) => {
      const sellers = sellersRes.data
      const products = productsRes.data
      const shipments = shipmentsRes.data

      setStats({
        pending_sellers: sellers.filter((s: any) => s.status === 'pending').length,
        pending_products: products.filter((p: any) => p.status === 'pending_review').length,
        pending_shipments: shipments.filter((s: any) => s.status === 'submitted').length,
        total_sellers: sellers.filter((s: any) => s.status === 'approved').length,
        total_products: products.filter((p: any) => p.status === 'listed').length,
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
    { label: 'Active Sellers', value: stats?.total_sellers ?? 0, href: '/admin/sellers', urgent: false },
    { label: 'Listed Products', value: stats?.total_products ?? 0, href: '/admin/products', urgent: false },
  ]

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
