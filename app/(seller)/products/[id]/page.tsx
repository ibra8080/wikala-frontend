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
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  price: string
  production_cost: string | null
  status: string
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

export default function ProductProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [editingCost, setEditingCost] = useState(false)
  const [productionCost, setProductionCost] = useState('')
  const [costSaving, setCostSaving] = useState(false)

  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/products/${params.id}/`)
      setProduct(res.data)
      setProductionCost(res.data.production_cost ?? '')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    void fetchProduct()
  }, [user, router, fetchProduct])

  const handleDelete = async () => {
    if (!product) return
    const activeStatuses = ['approved', 'awaiting_seller_shipment', 'in_warehouse_egypt', 'in_transit', 'in_warehouse_germany', 'listed']
    if (activeStatuses.includes(product.status)) {
      alert('This product is active. Please contact Wikala to request deletion.')
      return
    }
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/products/${product.id}/`)
      router.push('/products')
    } catch {
      alert('Failed to delete product.')
      setDeleting(false)
    }
  }

  const handleSaveCost = async () => {
    if (!product) return
    setCostSaving(true)
    try {
      await api.patch(`/products/${product.id}/`, { production_cost: productionCost || null })
      setEditingCost(false)
      await fetchProduct()
    } finally {
      setCostSaving(false)
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

  const canDelete = !['approved', 'awaiting_seller_shipment', 'in_warehouse_egypt', 'in_transit', 'in_warehouse_germany', 'listed'].includes(product.status)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">
            ← Back to Products
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/products/${product.id}/edit`}
            className="border border-[#E0DDDA] text-[#1B2A4A] px-4 py-2 rounded-lg text-sm font-medium hover:border-[#1B2A4A] transition"
          >
            Edit Product
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${canDelete
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
          >
            {deleting ? 'Deleting...' : canDelete ? 'Delete Product' : 'Request Deletion'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Images */}
        <div>
          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden mb-3">
            {product.images.length > 0 ? (
              <img
                src={product.images[activeImage]?.image_url}
                alt={product.name_en}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-[#F5F4F0] flex items-center justify-center">
                <p className="text-sm text-[#6B6560]">No images</p>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition
                    ${activeImage === i ? 'border-[#C8952E]' : 'border-transparent'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div className="col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-[#1B2A4A]">{product.name_en}</h1>
                <p className="text-sm text-[#6B6560] mt-0.5" dir="rtl">{product.name_ar}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyles[product.status] ?? ''}`}>
                {statusLabels[product.status] ?? product.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Product Code</p>
                <p className="font-mono font-medium text-[#1B2A4A]">{product.product_code || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Price</p>
                <p className="font-semibold text-[#1B2A4A]">€{product.price}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Added</p>
                <p className="text-[#1B2A4A]">{new Date(product.created_at).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            {/* Production Cost */}
            <div className="mt-4 pt-4 border-t border-[#E0DDDA]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B6560]">Production Cost (EUR)</p>
                <button
                  onClick={() => setEditingCost(!editingCost)}
                  className="text-xs text-[#C8952E] hover:underline"
                >
                  {editingCost ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingCost ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    value={productionCost}
                    onChange={e => setProductionCost(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]"
                  />
                  <button
                    onClick={handleSaveCost}
                    disabled={costSaving}
                    className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {costSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-medium text-[#1B2A4A] mt-1">
                  {product.production_cost ? `€${product.production_cost}` : '—'}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {(product.description_en || product.description_ar) && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
              <h2 className="font-semibold text-[#1B2A4A] mb-3">Description</h2>
              {product.description_en && <p className="text-sm text-[#6B6560] mb-2">{product.description_en}</p>}
              {product.description_ar && <p className="text-sm text-[#6B6560]" dir="rtl">{product.description_ar}</p>}
            </div>
          )}

          {/* Technical Specs */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.brand_name && (
                <div>
                  <p className="text-xs text-[#6B6560] mb-1">Brand</p>
                  <p className="text-[#1B2A4A]">{product.brand_name}</p>
                </div>
              )}
              {product.model_number && (
                <div>
                  <p className="text-xs text-[#6B6560] mb-1">Model</p>
                  <p className="text-[#1B2A4A]">{product.model_number}</p>
                </div>
              )}
              {product.materials && (
                <div>
                  <p className="text-xs text-[#6B6560] mb-1">Material</p>
                  <p className="text-[#1B2A4A]">{product.materials}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Dimensions (cm)</p>
                <p className="text-[#1B2A4A]">{product.unit_length_cm} × {product.unit_width_cm} × {product.unit_height_cm}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Weight</p>
                <p className="text-[#1B2A4A]">{product.unit_weight_kg} kg</p>
              </div>
              {product.custom_specs?.map((spec, i) => (
                <div key={i}>
                  <p className="text-xs text-[#6B6560] mb-1">{spec.key}</p>
                  <p className="text-[#1B2A4A]">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-4">Packaging</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Carton Dimensions (cm)</p>
                <p className="text-[#1B2A4A]">{product.carton_length_cm} × {product.carton_width_cm} × {product.carton_height_cm}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Carton Weight</p>
                <p className="text-[#1B2A4A]">{product.carton_weight_kg} kg</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6560] mb-1">Units per Carton</p>
                <p className="text-[#1B2A4A] font-medium">{product.units_per_carton}</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
              <h2 className="font-semibold text-[#1B2A4A] mb-4">Variants</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0DDDA]">
                    <th className="text-left text-xs text-[#6B6560] pb-2">SKU</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Color</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Size</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map(v => (
                    <tr key={v.id} className="border-b border-[#E0DDDA] last:border-0">
                      <td className="py-2 font-mono text-xs text-[#6B6560]">{v.sku || '—'}</td>
                      <td className="py-2 text-[#1B2A4A]">{v.color || '—'}</td>
                      <td className="py-2 text-[#1B2A4A]">{v.size || '—'}</td>
                      <td className="py-2 text-[#6B6560]">{v.external_barcode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}