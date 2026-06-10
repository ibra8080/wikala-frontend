'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface Seller {
  id: number
  seller_id: string
  full_name: string
  business_name: string
  country: string
  city: string
  status: string
  created_at: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  suspended: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function AdminSellersPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchSellers = useCallback(async () => {
    try {
      const res = await api.get('/sellers/admin/list/')
      setSellers(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchSellers()
  }, [user, router, fetchSellers])

  const handleAction = async (sellerId: number, action: 'approved' | 'rejected') => {
    setActionLoading(sellerId)
    try {
      await api.patch(`/sellers/admin/${sellerId}/`, { status: action })
      await fetchSellers()
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (sellerId: number) => {
    if (!confirm('Suspend this seller?')) return
    setActionLoading(sellerId)
    try {
      await api.patch(`/sellers/admin/${sellerId}/`, { status: 'suspended' })
      await fetchSellers()
    } finally { setActionLoading(null) }
  }

  const handleDelete = async (sellerId: number) => {
    if (!confirm('Permanently delete this seller and all their data?')) return
    setActionLoading(sellerId)
    try {
      await api.delete(`/sellers/admin/${sellerId}/`)
      await fetchSellers()
    } finally { setActionLoading(null) }
  }

  const filtered = sellers.filter(s => filter === 'all' ? true : s.status === filter)

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'all', label: 'All' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Sellers</h1>
        <p className="text-sm text-[#6B6560] mt-1">{sellers.length} total sellers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${filter === tab.key
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'
              }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-70">
              {tab.key === 'all' ? sellers.length : sellers.filter(s => s.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Seller</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">ID</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Location</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Status</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Date</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(seller => (
              <tr key={seller.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-[#1B2A4A]">{seller.full_name}</p>
                  <p className="text-xs text-[#6B6560] mt-0.5">{seller.business_name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-mono text-[#6B6560]">{seller.seller_id || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[#6B6560]">{seller.city}, {seller.country}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[seller.status] ?? ''}`}>
                    {seller.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[#6B6560]">
                    {new Date(seller.created_at).toLocaleDateString('en-GB')}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Link href={`/admin/sellers/${seller.id}`}
                      className="text-xs text-[#1B2A4A] border border-[#E0DDDA] px-3 py-1.5 rounded-lg hover:border-[#1B2A4A] transition">
                      View
                    </Link>
                    {seller.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(seller.id, 'approved')} disabled={actionLoading === seller.id}
                          className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition disabled:opacity-50">
                          Approve
                        </button>
                        <button onClick={() => handleAction(seller.id, 'rejected')} disabled={actionLoading === seller.id}
                          className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition disabled:opacity-50">
                          Reject
                        </button>
                      </>
                    )}
                    {seller.status === 'approved' && (
                      <button onClick={() => handleSuspend(seller.id)} disabled={actionLoading === seller.id}
                        className="bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition disabled:opacity-50">
                        Suspend
                      </button>
                    )}
                    {seller.status === 'suspended' && (
                      <button onClick={() => handleAction(seller.id, 'approved')} disabled={actionLoading === seller.id}
                        className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition disabled:opacity-50">
                        Reactivate
                      </button>
                    )}
                    <button onClick={() => handleDelete(seller.id)} disabled={actionLoading === seller.id}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B6560]">
                  No sellers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}