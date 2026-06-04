'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Product {
  id: number
  product_code: string
  name_en: string
  name_ar: string
  status: string
  seller: number
}

const statusFlow = [
  'awaiting_seller_shipment',
  'in_warehouse_egypt',
  'in_transit',
  'in_warehouse_germany',
  'listed',
]

const statusLabels: Record<string, string> = {
  awaiting_seller_shipment: 'Awaiting Shipment',
  in_warehouse_egypt: 'In Egypt Warehouse',
  in_transit: 'In Transit',
  in_warehouse_germany: 'In Germany Warehouse',
  listed: 'Listed',
}

const statusStyles: Record<string, string> = {
  awaiting_seller_shipment: 'bg-purple-50 text-purple-700 border-purple-200',
  in_warehouse_egypt: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  in_warehouse_germany: 'bg-teal-50 text-teal-700 border-teal-200',
  listed: 'bg-green-50 text-green-700 border-green-200',
}

const nextStatus: Record<string, string> = {
  awaiting_seller_shipment: 'in_warehouse_egypt',
  in_warehouse_egypt: 'in_transit',
  in_transit: 'in_warehouse_germany',
  in_warehouse_germany: 'listed',
}

const nextStatusLabel: Record<string, string> = {
  awaiting_seller_shipment: 'Mark as Received in Egypt',
  in_warehouse_egypt: 'Mark as In Transit',
  in_transit: 'Mark as Arrived in Germany',
  in_warehouse_germany: 'Mark as Listed',
}

export default function TrackingPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')
  const [noteId, setNoteId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products/admin/list/')
      const trackable = res.data.filter((p: Product & { status: string }) =>
        statusFlow.includes(p.status)
      )
      setProducts(trackable)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchProducts()
  }, [user, router, fetchProducts])

  const handleAdvance = async (product: Product) => {
    const next = nextStatus[product.status]
    if (!next) return
    setActionLoading(product.id)
    try {
      await api.post('/inventory/admin/shipment/update/', {
        product: product.id,
        to_status: next,
        note: note,
      })
      setNoteId(null)
      setNote('')
      await fetchProducts()
    } catch {
      alert('Failed to update status.')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredProducts = products.filter(p =>
    filter === 'all' ? true : p.status === filter
  )

  const tabs = [
    { key: 'all', label: 'All' },
    ...statusFlow.slice(0, -1).map(s => ({ key: s, label: statusLabels[s] }))
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/warehouses" className="text-sm text-[#6B6560] hover:text-[#1B2A4A]">
          ← Warehouses
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Shipment Tracking</h1>
        <p className="text-sm text-[#6B6560] mt-1">{products.length} products in pipeline</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${filter === tab.key ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
            {tab.label}
            <span className="ml-2 text-xs opacity-70">
              {tab.key === 'all' ? products.length : products.filter(p => p.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Pipeline Visual */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl border border-[#E0DDDA] p-4 overflow-x-auto">
        {statusFlow.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusStyles[s]}`}>
              {statusLabels[s]}
              <span className="ml-2 font-bold">
                {products.filter(p => p.status === s).length}
              </span>
            </div>
            {i < statusFlow.length - 1 && (
              <span className="text-[#E0DDDA] text-lg">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Product</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Code</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Current Status</th>
              <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Next Step</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <>
                <tr key={product.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
                    <p className="text-xs text-[#6B6560] mt-0.5" dir="rtl">{product.name_ar}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-[#6B6560]">{product.product_code || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[product.status] ?? ''}`}>
                      {statusLabels[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {nextStatus[product.status] ? (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setNoteId(noteId === product.id ? null : product.id)}
                          disabled={actionLoading === product.id}
                          className="bg-[#C8952E] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#b07d25] disabled:opacity-50 transition"
                        >
                          {nextStatusLabel[product.status]}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">✅ Listed</span>
                    )}
                  </td>
                </tr>

                {/* Note Row */}
                {noteId === product.id && (
                  <tr key={`note-${product.id}`} className="bg-[#F5F4F0] border-b border-[#E0DDDA]">
                    <td colSpan={4} className="px-6 py-3">
                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Add a note (optional)..."
                          className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]"
                        />
                        <button
                          onClick={() => handleAdvance(product)}
                          disabled={actionLoading === product.id}
                          className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition"
                        >
                          {actionLoading === product.id ? 'Updating...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => { setNoteId(null); setNote('') }}
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
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-[#6B6560]">
                  No products in this stage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}