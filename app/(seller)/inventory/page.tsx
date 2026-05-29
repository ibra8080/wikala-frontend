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
  execution_status: string
  issue_note: string
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

interface InventoryItem {
  id: number
  variant_sku: string
  quantity_in_egypt: number
  quantity_in_transit: number
  quantity_in_germany: number
  quantity_sold: number
  quantity_available: number
}

interface Product {
  id: number
  product_code: string
  name_en: string
  status: string
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

const productStatusStyles: Record<string, string> = {
  in_warehouse_egypt: 'bg-orange-50 text-orange-700 border border-orange-200',
  in_transit: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  in_warehouse_germany: 'bg-teal-50 text-teal-700 border border-teal-200',
  listed: 'bg-green-50 text-green-700 border border-green-200',
  awaiting_seller_shipment: 'bg-purple-50 text-purple-700 border border-purple-200',
}

const productStatusLabels: Record<string, string> = {
  awaiting_seller_shipment: 'Awaiting Shipment',
  in_warehouse_egypt: 'In Egypt Warehouse',
  in_transit: 'In Transit',
  in_warehouse_germany: 'In Germany Warehouse',
  listed: 'Listed',
}

type Tab = 'shipments' | 'egypt' | 'germany'

export default function InventoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('shipments')
  const [requests, setRequests] = useState<ShipmentRequest[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, invRes, prodRes] = await Promise.all([
        api.get('/inventory/shipment-requests/'),
        api.get('/inventory/'),
        api.get('/products/'),
      ])
      setRequests(reqRes.data)
      setInventory(invRes.data)
      setProducts(prodRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    void fetchAll()
  }, [user, router, fetchAll])

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this request?')) return
    try {
      await api.patch(`/inventory/shipment-requests/${id}/`, { status: 'cancelled' })
      await fetchAll()
    } catch {
      alert('Cannot cancel this request.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this draft?')) return
    try {
      await api.delete(`/inventory/shipment-requests/${id}/`)
      await fetchAll()
    } catch {
      alert('Cannot delete this request.')
    }
  }

  const egyptProducts = products.filter(p => p.status === 'in_warehouse_egypt')
  const germanyProducts = products.filter(p => ['in_warehouse_germany', 'listed'].includes(p.status))

  const tabs = [
    { key: 'shipments' as Tab, label: 'Shipment Requests', count: requests.length },
    { key: 'egypt' as Tab, label: 'Egypt Warehouse', count: egyptProducts.length },
    { key: 'germany' as Tab, label: 'Germany Warehouse', count: germanyProducts.length },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Inventory</h1>
        {activeTab === 'shipments' && (
          <Link href="/inventory/new"
            className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition">
            + New Request
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab.key
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'
              }`}>
            {tab.label}
            <span className="ml-2 text-xs opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab: Shipment Requests */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          {requests.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-16 text-center">
              <p className="text-4xl mb-4">📦</p>
              <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">No shipment requests yet</h2>
              <p className="text-sm text-[#6B6560] mb-6">Create a shipment request when your products are ready to send.</p>
              <Link href="/inventory/new"
                className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition">
                Create First Request
              </Link>
            </div>
          )}

          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
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
                  {req.execution_status === 'issue' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      ⚠️ Issue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#6B6560]">{req.items.length} products</span>
                  <button onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="text-sm text-[#C8952E] hover:underline">
                    {expandedId === req.id ? 'Hide ↑' : 'Details ↓'}
                  </button>
                  {req.status === 'draft' && (
                    <>
                      <Link href={`/inventory/${req.id}/edit`}
                        className="text-sm text-[#1B2A4A] border border-[#E0DDDA] px-3 py-1.5 rounded-lg hover:border-[#1B2A4A] transition">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(req.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition">
                        Delete
                      </button>
                    </>
                  )}
                  {req.status === 'submitted' && (
                    <button onClick={() => handleCancel(req.id)}
                      className="text-sm text-red-500 hover:text-red-700 transition">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {expandedId === req.id && (
                <div className="border-t border-[#E0DDDA] px-6 py-4">
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

                  {req.notes && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-[#1B2A4A]">{req.notes}</p>
                    </div>
                  )}

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
                            <p className="text-xs text-green-600">Notes from Wikala</p>
                            <p className="text-sm font-medium text-green-800">{req.delivery_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {req.execution_status === 'issue' && req.issue_note && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                        ⚠️ Issue Reported by Wikala
                      </p>
                      <p className="text-sm text-red-700">{req.issue_note}</p>
                      <p className="text-xs text-red-500 mt-2">
                        Please contact Wikala via Messages to resolve this issue.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Egypt Warehouse */}
      {activeTab === 'egypt' && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
          {egyptProducts.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-4">🏭</p>
              <p className="text-lg font-semibold text-[#1B2A4A] mb-2">No products in Egypt warehouse</p>
              <p className="text-sm text-[#6B6560]">Products will appear here after Wikala receives them.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Product</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Code</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {egyptProducts.map(product => (
                  <tr key={product.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-[#6B6560]">{product.product_code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${productStatusStyles[product.status] ?? ''}`}>
                        {productStatusLabels[product.status] ?? product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Germany Warehouse */}
      {activeTab === 'germany' && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
          {germanyProducts.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-4">🇩🇪</p>
              <p className="text-lg font-semibold text-[#1B2A4A] mb-2">No products in Germany warehouse</p>
              <p className="text-sm text-[#6B6560]">Products will appear here after they arrive in Germany.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Product</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Code</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">SKU</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Available</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">In Transit</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Sold</th>
                  <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {germanyProducts.map(product => {
                  const inv = inventory.filter(i => i.variant_sku?.startsWith(product.product_code ?? ''))
                  return inv.length > 0 ? inv.map(item => (
                    <tr key={item.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-[#6B6560]">{product.product_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-[#6B6560]">{item.variant_sku}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#1B2A4A]">{item.quantity_available}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#6B6560]">{item.quantity_in_transit}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#6B6560]">{item.quantity_sold}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${productStatusStyles[product.status] ?? ''}`}>
                          {productStatusLabels[product.status] ?? product.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr key={product.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-[#6B6560]">{product.product_code}</p>
                      </td>
                      <td colSpan={4} className="px-6 py-4 text-xs text-[#6B6560]">No inventory data yet</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${productStatusStyles[product.status] ?? ''}`}>
                          {productStatusLabels[product.status] ?? product.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}