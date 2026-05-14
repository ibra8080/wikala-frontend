'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface ShipmentItem {
  id: number
  product: number
  product_name: string
  product_code: string
  cartons_count: number
  units_per_carton: number
  total_units: number
  carton_weight_kg: string
  carton_length_cm: string
  carton_width_cm: string
  carton_height_cm: string
}

interface ShipmentRequest {
  id: number
  request_number: string
  seller_name: string
  requested_date: string
  request_date: string
  status: string
  notes: string
  delivery_date: string | null
  delivery_method: string
  delivery_notes: string
  created_at: string
  available_from: string
  delivery_address: string
  contact_person: string
  contact_number: string
  items: ShipmentItem[]
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const tabs = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'draft', label: 'Draft' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
]

export default function AdminShipmentsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [requests, setRequests] = useState<ShipmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('submitted')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const [acceptForm, setAcceptForm] = useState({
    delivery_date: '',
    delivery_notes: '',
  })

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/inventory/admin/shipment-requests/')
      setRequests(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchRequests()
  }, [user, router, fetchRequests])

  const handleAccept = async (id: number) => {
    if (!acceptForm.delivery_date) return
    setActionLoading(id)
    try {
      await api.patch(`/inventory/admin/shipment-requests/${id}/`, {
        status: 'accepted',
        delivery_date: acceptForm.delivery_date,
        delivery_notes: acceptForm.delivery_notes,
      })
      setAcceptingId(null)
      setAcceptForm({ delivery_date: '', delivery_notes: '' })
      await fetchRequests()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter)

  const deliveryMethodLabels: Record<string, string> = {
    pickup: 'Pickup by Wikala',
    courier: 'Courier',
    drop_off: 'Drop Off at Wikala',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Shipment Requests</h1>
        <p className="text-sm text-[#6B6560] mt-1">{requests.length} total requests</p>
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
              {tab.key === 'all' ? requests.length : requests.filter(r => r.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-mono font-semibold text-[#1B2A4A]">{req.request_number}</p>
                  <p className="text-sm text-[#6B6560] mt-0.5">{req.seller_name}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[req.status] ?? ''}`}>
                  {req.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-[#6B6560]">Submitted</p>
                  <p className="text-sm text-[#1B2A4A] font-medium">
                    {new Date(req.request_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B6560]">Items</p>
                  <p className="text-sm text-[#1B2A4A] font-medium">{req.items.length}</p>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="text-sm text-[#C8952E] hover:underline"
                >
                  {expandedId === req.id ? 'Hide ↑' : 'View ↓'}
                </button>
              </div>
            </div>

            {/* Expanded */}
            {expandedId === req.id && (
              <div className="border-t border-[#E0DDDA]">
                {/* Items */}
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Products</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E0DDDA]">
                        <th className="text-left text-xs text-[#6B6560] pb-2">Product</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Code</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Cartons</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Units/Carton</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Total Units</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Carton (cm)</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Weight (kg)</th>
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
                          <td className="py-2 text-xs text-[#6B6560]">
                            {item.carton_length_cm} × {item.carton_width_cm} × {item.carton_height_cm}
                          </td>
                          <td className="py-2 text-[#6B6560]">{item.carton_weight_kg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Seller Delivery Info */}
                <div className="px-6 py-4 border-t border-[#E0DDDA] grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Delivery Preference</p>
                    <div className="space-y-2">
                      <div className="flex gap-2 text-sm">
                        <span className="text-[#6B6560] w-32">Method</span>
                        <span className="text-[#1B2A4A] font-medium">{deliveryMethodLabels[req.delivery_method] ?? req.delivery_method}</span>
                      </div>
                      {req.delivery_address && (
                        <div className="flex gap-2 text-sm">
                          <span className="text-[#6B6560] w-32">Address</span>
                          <span className="text-[#1B2A4A]">{req.delivery_address}</span>
                        </div>
                      )}
                      <div className="flex gap-2 text-sm">
                        <span className="text-[#6B6560] w-32">Available From</span>
                        <span className="text-[#1B2A4A] font-medium">{req.available_from}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Contact Information</p>
                    <div className="space-y-2">
                      <div className="flex gap-2 text-sm">
                        <span className="text-[#6B6560] w-32">Person</span>
                        <span className="text-[#1B2A4A] font-medium">{req.contact_person}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-[#6B6560] w-32">Number</span>
                        <span className="text-[#1B2A4A]">{req.contact_number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {req.notes && (
                  <div className="px-6 pb-4">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-1">Seller Notes</p>
                    <p className="text-sm text-[#1B2A4A]">{req.notes}</p>
                  </div>
                )}

                {/* Delivery info (if accepted) */}
                {req.status === 'accepted' && (
                  <div className="px-6 pb-4 bg-green-50 border-t border-green-100">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 pt-3">Delivery Details</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-green-600">Date</p>
                        <p className="text-sm font-medium text-green-800">{req.delivery_date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Method</p>
                        <p className="text-sm font-medium text-green-800">{deliveryMethodLabels[req.delivery_method] ?? req.delivery_method}</p>
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

                {/* Accept form */}
                {req.status === 'submitted' && (
                  <div className="px-6 pb-4 border-t border-[#E0DDDA] pt-4">
                    {acceptingId === req.id ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-[#1B2A4A]">Confirm delivery details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[#6B6560] mb-1">Delivery Date <span className="text-red-400">*</span></label>
                            <input
                              type="date"
                              value={acceptForm.delivery_date}
                              onChange={e => setAcceptForm(p => ({ ...p, delivery_date: e.target.value }))}
                              min={req.available_from}
                              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#6B6560] mb-1">Notes (optional)</label>
                            <input
                              type="text"
                              value={acceptForm.delivery_notes}
                              onChange={e => setAcceptForm(p => ({ ...p, delivery_notes: e.target.value }))}
                              placeholder="Additional details..."
                              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(req.id)}
                            disabled={!acceptForm.delivery_date || actionLoading === req.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            {actionLoading === req.id ? 'Accepting...' : 'Confirm Accept'}
                          </button>
                          <button
                            onClick={() => setAcceptingId(null)}
                            className="text-sm text-[#6B6560] hover:text-[#1B2A4A] px-4 py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAcceptingId(req.id)}
                        className="bg-[#C8952E] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition"
                      >
                        Accept Request →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-12 text-center">
            <p className="text-sm text-[#6B6560]">No shipment requests found.</p>
          </div>
        )}
      </div>
    </div>
  )
}