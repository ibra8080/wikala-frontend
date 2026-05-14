'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface ShipmentRequest {
  id: number
  request_number: string
  request_date: string
  status: string
  notes: string
  delivery_date: string | null
  delivery_method: string
  delivery_notes: string
  created_at: string
  items: ShipmentItem[]
}

interface ShipmentItem {
  id: number
  product: number
  product_name: string
  product_code: string
  cartons_count: number
  units_per_carton: number
  total_units: number
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
}

const deliveryMethodLabels: Record<string, string> = {
  pickup: 'Pickup by Wikala',
  courier: 'Courier',
  drop_off: 'Drop Off at Wikala',
}

export default function InventoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [requests, setRequests] = useState<ShipmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/inventory/shipment-requests/')
      setRequests(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    void fetchRequests()
  }, [user, router, fetchRequests])

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this request?')) return
    try {
      await api.patch(`/inventory/shipment-requests/${id}/`, { status: 'cancelled' })
      await fetchRequests()
    } catch {
      alert('Cannot cancel this request.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this draft?')) return
    try {
      await api.delete(`/inventory/shipment-requests/${id}/`)
      await fetchRequests()
    } catch {
      alert('Cannot delete this request.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Shipment Requests</h1>
          <p className="text-sm text-[#6B6560] mt-1">{requests.length} total requests</p>
        </div>
        <Link
          href="/inventory/new"
          className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition"
        >
          + New Request
        </Link>
      </div>

      {requests.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-16 text-center">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">No shipment requests yet</h2>
          <p className="text-sm text-[#6B6560] mb-6">
            Create a shipment request when your products are ready to send.
          </p>
          <Link
            href="/inventory/new"
            className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition"
          >
            Create First Request
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-mono font-semibold text-[#1B2A4A]">{req.request_number}</p>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Requested: {new Date(req.request_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[req.status] ?? ''}`}>
                  {statusLabels[req.status] ?? req.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B6560]">{req.items.length} products</span>
                <button
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="text-sm text-[#C8952E] hover:underline"
                >
                  {expandedId === req.id ? 'Hide ↑' : 'Details ↓'}
                </button>
                {req.status === 'draft' && (
                  <>
                    <Link
                      href={`/inventory/${req.id}/edit`}
                      className="text-sm text-[#1B2A4A] border border-[#E0DDDA] px-3 py-1.5 rounded-lg hover:border-[#1B2A4A] transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="text-sm text-red-500 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  </>
                )}
                {req.status === 'submitted' && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="text-sm text-red-500 hover:text-red-700 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Expanded */}
            {expandedId === req.id && (
              <div className="border-t border-[#E0DDDA] px-6 py-4">
                {/* Items */}
                <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Products</p>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-[#E0DDDA]">
                      <th className="text-left text-xs text-[#6B6560] pb-2">Product</th>
                      <th className="text-left text-xs text-[#6B6560] pb-2">Code</th>
                      <th className="text-left text-xs text-[#6B6560] pb-2">Cartons</th>
                      <th className="text-left text-xs text-[#6B6560] pb-2">Units/Carton</th>
                      <th className="text-left text-xs text-[#6B6560] pb-2">Total Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map(item => (
                      <tr key={item.id} className="border-b border-[#E0DDDA] last:border-0">
                        <td className="py-2 text-[#1B2A4A]">{item.product_name}</td>
                        <td className="py-2 font-mono text-xs text-[#6B6560]">{item.product_code}</td>
                        <td className="py-2 text-[#1B2A4A]">{item.cartons_count}</td>
                        <td className="py-2 text-[#1B2A4A]">{item.units_per_carton}</td>
                        <td className="py-2 font-semibold text-[#1B2A4A]">{item.total_units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Notes */}
                {req.notes && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-[#1B2A4A]">{req.notes}</p>
                  </div>
                )}

                {/* Delivery info */}
                {req.status === 'accepted' && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                      ✅ Delivery Details from Wikala
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-green-600">Date</p>
                        <p className="text-sm font-medium text-green-800">{req.delivery_date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Method</p>
                        <p className="text-sm font-medium text-green-800">
                          {deliveryMethodLabels[req.delivery_method] ?? req.delivery_method}
                        </p>
                      </div>
                      {req.delivery_notes && (
                        <div>
                          <p className="text-xs text-green-600">Notes</p>
                          <p className="text-sm font-medium text-green-800">{req.delivery_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}