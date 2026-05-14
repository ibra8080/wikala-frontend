'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface Product {
  id: number
  product_code: string
  name_en: string
  name_ar: string
  price: string
  status: string
  created_at: string
  seller: number
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  awaiting_seller_shipment: 'bg-purple-50 text-purple-700',
  in_warehouse_egypt: 'bg-orange-50 text-orange-700',
  in_transit: 'bg-cyan-50 text-cyan-700',
  in_warehouse_germany: 'bg-teal-50 text-teal-700',
  listed: 'bg-green-50 text-green-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  awaiting_seller_shipment: 'Awaiting Shipment',
  in_warehouse_egypt: 'In Egypt Warehouse',
  in_transit: 'In Transit',
  in_warehouse_germany: 'In Germany Warehouse',
  listed: 'Listed',
}

const tabs = [
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'listed', label: 'Listed' },
  { key: 'all', label: 'All' },
]

export default function AdminProductsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending_review')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products/admin/list/')
      setProducts(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchProducts()
  }, [user, router, fetchProducts])

  const handleApprove = async (productId: number) => {
    setActionLoading(productId)
    try {
      await api.patch(`/products/admin/${productId}/`, { status: 'approved' })
      await fetchProducts()
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (productId: number) => {
    if (!rejectReason.trim()) return
    setActionLoading(productId)
    try {
      await api.patch(`/products/admin/${productId}/`, {
        status: 'rejected',
        rejection_reason: rejectReason,
      })
      setRejectingId(null)
      setRejectReason('')
      await fetchProducts()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = products.filter(p => filter === 'all' ? true : p.status === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Products</h1>
        <p className="text-sm text-[#6B6560] mt-1">{products.length} total products</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
              {tab.key === 'all' ? products.length : products.filter(p => p.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Product</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Code</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Price</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Status</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Date</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <>
                <tr key={product.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
                    <p className="text-xs text-[#6B6560] mt-0.5">{product.name_ar}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-[#6B6560]">{product.product_code || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1B2A4A]">€{product.price}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[product.status] ?? ''}`}>
                      {statusLabels[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#6B6560]">
                      {new Date(product.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {product.status === 'pending_review' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(product.id)}
                          disabled={actionLoading === product.id}
                          className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(product.id)}
                          disabled={actionLoading === product.id}
                          className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {rejectingId === product.id && (
                  <tr key={`reject-${product.id}`} className="bg-red-50 border-b border-[#E0DDDA]">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          className="flex-1 border border-red-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-400"
                        />
                        <button
                          onClick={() => handleReject(product.id)}
                          disabled={!rejectReason.trim() || actionLoading === product.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason('') }}
                          className="text-sm text-[#6B6560] hover:text-[#1B2A4A]"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B6560]">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}