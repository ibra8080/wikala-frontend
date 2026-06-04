'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface ProductImage {
  id: number
  image_url: string
  is_primary: boolean
  order: number
}

interface ProductVariant {
  id: number
  color: string
  size: string
  sku: string
  external_barcode: string
  quantity_submitted: number
}

interface Product {
  id: number
  product_code: string
  seller: number
  name_en: string
  name_ar: string
  name_de: string
  description_en: string
  description_ar: string
  description_de: string
  price: string
  production_cost: string | null
  status: string
  previous_status: string
  rejection_reason: string
  brand_name: string
  model_number: string
  materials: string
  unit_weight_kg: string
  unit_length_cm: string
  unit_width_cm: string
  unit_height_cm: string
  units_per_carton: number
  carton_weight_kg: string
  carton_length_cm: string
  carton_width_cm: string
  carton_height_cm: string
  custom_specs: { key: string; value: string }[]
  images: ProductImage[]
  variants: ProductVariant[]
  created_at: string
  approved_at: string | null
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border border-blue-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  awaiting_seller_shipment: 'bg-purple-50 text-purple-700 border border-purple-200',
  in_warehouse_egypt: 'bg-orange-50 text-orange-700 border border-orange-200',
  in_transit: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  in_warehouse_germany: 'bg-teal-50 text-teal-700 border border-teal-200',
  listed: 'bg-green-50 text-green-700 border border-green-200',
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

function ReadOnlyField({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div className="py-3 border-b border-[#F5F4F0] last:border-0">
      <p className="text-xs text-[#6B6560] mb-1">{label}</p>
      <p className="text-sm text-[#1B2A4A]" dir={dir}>{value || '—'}</p>
    </div>
  )
}

export default function AdminProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, _hasHydrated } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/products/admin/${params.id}/`)
      setProduct(res.data)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchProduct()
  }, [user, _hasHydrated, router, fetchProduct])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await api.patch(`/products/admin/${product!.id}/`, { status: 'approved' })
      await fetchProduct()
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    setActionLoading(true)
    try {
      await api.patch(`/products/admin/${product!.id}/`, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      })
      setShowRejectForm(false)
      await fetchProduct()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!product) return (
    <div className="text-center py-16">
      <p className="text-[#6B6560]">Product not found.</p>
    </div>
  )

  const isPending = product.status === 'pending_review'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin/products" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">
          ← Back to Products
        </Link>

        {isPending && (
          <div className="flex gap-3">
            <button onClick={handleApprove} disabled={actionLoading}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
              {actionLoading ? '...' : 'Approve'}
            </button>
            <button onClick={() => setShowRejectForm(!showRejectForm)} disabled={actionLoading}
              className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition">
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-red-700 mb-2">Rejection Reason</p>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            rows={3}
            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50">
              Confirm Rejection
            </button>
            <button onClick={() => setShowRejectForm(false)}
              className="text-xs text-[#6B6560] px-3 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rejection reason display */}
      {product.status === 'rejected' && product.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{product.rejection_reason}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Images */}
        <div>
          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden mb-3">
            {product.images.length > 0 ? (
              <img src={product.images[activeImage]?.image_url} alt={product.name_en}
                className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square bg-[#F5F4F0] flex items-center justify-center">
                <p className="text-sm text-[#6B6560]">No images</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {product.images.map((img, i) => (
              <button key={img.id} onClick={() => setActiveImage(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition
                  ${activeImage === i ? 'border-[#C8952E]' : 'border-transparent'}`}>
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Status + Code */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6B6560]">Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[product.status] ?? ''}`}>
                {statusLabels[product.status] ?? product.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-[#6B6560] mb-1">Product Code</p>
              <p className="font-mono font-medium text-sm text-[#1B2A4A]">{product.product_code || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B6560] mb-1">Seller ID</p>
              <p className="text-sm text-[#1B2A4A]">#{product.seller}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B6560] mb-1">Added</p>
              <p className="text-sm text-[#1B2A4A]">{new Date(product.created_at).toLocaleDateString('en-GB')}</p>
            </div>
            {product.approved_at && (
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Approved</p>
                <p className="text-sm text-[#1B2A4A]">{new Date(product.approved_at).toLocaleDateString('en-GB')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Details */}
        <div className="col-span-2 space-y-4">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Basic Information</h2>
            <ReadOnlyField label="Product Name (English)" value={product.name_en} />
            <ReadOnlyField label="Product Name (Arabic)" value={product.name_ar} dir="rtl" />
            <ReadOnlyField label="Price (EUR)" value={`€${product.price}`} />
            <ReadOnlyField label="Production Cost (EUR)" value={product.production_cost ? `€${product.production_cost}` : ''} />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Description</h2>
            <ReadOnlyField label="Description (English)" value={product.description_en} />
            <ReadOnlyField label="Description (Arabic)" value={product.description_ar} dir="rtl" />
          </div>

          {/* Technical Specs */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Technical Specifications</h2>
            <ReadOnlyField label="Brand" value={product.brand_name} />
            <ReadOnlyField label="Model Number" value={product.model_number} />
            <ReadOnlyField label="Material" value={product.materials} />
            <ReadOnlyField label="Weight (kg)" value={product.unit_weight_kg} />
            <ReadOnlyField label="Length (cm)" value={product.unit_length_cm} />
            <ReadOnlyField label="Width (cm)" value={product.unit_width_cm} />
            <ReadOnlyField label="Height (cm)" value={product.unit_height_cm} />
          </div>

          {/* Packaging */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Packaging</h2>
            <ReadOnlyField label="Carton Weight (kg)" value={product.carton_weight_kg} />
            <ReadOnlyField label="Carton Length (cm)" value={product.carton_length_cm} />
            <ReadOnlyField label="Carton Width (cm)" value={product.carton_width_cm} />
            <ReadOnlyField label="Carton Height (cm)" value={product.carton_height_cm} />
            <ReadOnlyField label="Units per Carton" value={String(product.units_per_carton ?? '—')} />
          </div>

          {/* Variants */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-4">Variants</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E0DDDA]">
                  <th className="text-left text-xs text-[#6B6560] pb-2">SKU</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Color</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Size</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Barcode</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map(v => (
                  <tr key={v.id} className="border-b border-[#E0DDDA] last:border-0">
                    <td className="py-2 font-mono text-xs text-[#6B6560]">{v.sku || '—'}</td>
                    <td className="py-2 text-[#1B2A4A]">{v.color || '—'}</td>
                    <td className="py-2 text-[#1B2A4A]">{v.size || '—'}</td>
                    <td className="py-2 text-[#6B6560] text-xs">{v.external_barcode || '—'}</td>
                    <td className="py-2 text-[#1B2A4A]">{v.quantity_submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}