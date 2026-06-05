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

const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

function Field({
  label, field, value, type = 'text', multiline = false,
  editingField, editValues, saving,
  onEdit, onSave, onCancel, onValueChange,
}: {
  label: string
  field: string
  value: string
  type?: string
  multiline?: boolean
  editingField: string | null
  editValues: Record<string, string>
  saving: boolean
  onEdit: (field: string, value: string) => void
  onSave: (field: string | string[]) => void
  onCancel: () => void
  onValueChange: (field: string, value: string) => void
}) {
  return (
    <div className="py-3 border-b border-[#F5F4F0] last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-[#6B6560] mb-1">{label}</p>
          {editingField === field ? (
            <div className="flex gap-2 items-start mt-1">
              {multiline ? (
                <textarea
                  value={editValues[field] ?? ''}
                  onChange={e => onValueChange(field, e.target.value)}
                  rows={3}
                  className={inputClass + ' resize-none flex-1'}
                />
              ) : (
                <input
                  type={type}
                  value={editValues[field] ?? ''}
                  onChange={e => onValueChange(field, e.target.value)}
                  className={inputClass + ' flex-1'}
                />
              )}
              <button onClick={() => void onSave(field)}
                disabled={saving}
                className="bg-[#1B2A4A] text-white px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 whitespace-nowrap">
                {saving ? '...' : 'Save'}
              </button>
              <button onClick={onCancel}
                className="text-xs text-[#6B6560] px-2 py-2 hover:text-[#1B2A4A]">
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#1B2A4A] mt-0.5">{value || '—'}</p>
          )}
        </div>
        {editingField !== field && (
          <button onClick={() => onEdit(field, value)}
            className="text-xs text-[#C8952E] hover:underline mt-4 whitespace-nowrap">
            Edit
          </button>
        )}
      </div>
    </div>
  )
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

type EditingField = string | null

export default function ProductProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user, _hasHydrated } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [saving, setSaving] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/products/${params.id}/`)
      setProduct(res.data)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    void fetchProduct()
  }, [user, _hasHydrated, router, fetchProduct])

  const startEdit = (field: string, value: string) => {
    setEditingField(field)
    setEditValues(prev => ({ ...prev, [field]: value ?? '' }))
  }

  const cancelEdit = () => setEditingField(null)

  const saveField = async (field: string | string[]) => {
    if (!product) return
    setSaving(true)
    try {
      const fields = Array.isArray(field) ? field : [field]
      const payload: Record<string, string> = {}
      fields.forEach(f => { payload[f] = editValues[f] })
      await api.patch(`/products/${product.id}/`, payload)
      setEditingField(null)
      await fetchProduct()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    const activeStatuses = ['approved', 'awaiting_seller_shipment', 'in_warehouse_egypt', 'in_transit', 'in_warehouse_germany', 'listed']
    if (activeStatuses.includes(product.status)) {
      alert('This product is active. Please contact Wikala to request deletion.')
      return
    }
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(true)
    try {
      await api.delete(`/products/${product.id}/`)
      router.push('/products')
    } catch {
      alert('Failed to delete product.')
      setDeleting(false)
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return
    try {
      await api.delete(`/products/${product!.id}/images/${imageId}/`)
      await fetchProduct()
    } catch {
      alert('Failed to delete image.')
    }
  }

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if ((product?.images.length ?? 0) + files.length > 12) {
      alert('Maximum 12 images allowed.')
      return
    }
    for (const file of files) {
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/products/${product!.id}/images/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    await fetchProduct()
  }

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('Delete this variant?')) return
    try {
      await api.delete(`/products/${product!.id}/variants/${variantId}/`)
      await fetchProduct()
    } catch {
      alert('Failed to delete variant.')
    }
  }

  const [editingVariant, setEditingVariant] = useState<number | null>(null)
  const [variantEdit, setVariantEdit] = useState({ color: '', size: '' })
  const [addingVariant, setAddingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({ color: '', size: '', external_barcode: '' })

  const handleSaveVariant = async (variantId: number) => {
    setSaving(true)
    try {
      await api.patch(`/products/${product!.id}/variants/${variantId}/`, variantEdit)
      setEditingVariant(null)
      await fetchProduct()
    } finally {
      setSaving(false)
    }
  }

  const handleAddVariant = async () => {
    setSaving(true)
    try {
      await api.post(`/products/${product!.id}/variants/`, {
        ...newVariant,
        quantity_submitted: 0,
      })
      setAddingVariant(false)
      setNewVariant({ color: '', size: '', external_barcode: '' })
      await fetchProduct()
    } finally {
      setSaving(false)
    }
  }

  const canDelete = !['approved', 'awaiting_seller_shipment', 'in_warehouse_egypt', 'in_transit', 'in_warehouse_germany', 'listed'].includes(product?.status ?? '')

  const fieldProps = {
    editingField,
    editValues,
    saving,
    onEdit: startEdit,
    onSave: saveField,
    onCancel: cancelEdit,
    onValueChange: (field: string, value: string) => setEditValues(p => ({ ...p, [field]: value })),
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/products" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">
          ← Back to Products
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

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Images */}
        <div>
          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden mb-3">
            {product.images.length > 0 ? (
              <div className="relative group">
                <img src={product.images[activeImage]?.image_url} alt={product.name_en}
                  className="w-full aspect-square object-cover" />
                <button
                  onClick={() => handleDeleteImage(product.images[activeImage].id)}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  Delete
                </button>
              </div>
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

          {/* Add Images */}
          {product.images.length < 12 && (
            <label className="block w-full border border-dashed border-[#C8952E] text-[#C8952E] rounded-xl py-2.5 text-sm font-medium text-center hover:bg-[#F5F4F0] transition cursor-pointer mb-3">
              + Add Photos ({product.images.length}/12)
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={handleAddImages} />
            </label>
          )}

          {/* Status + Code */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-4 mt-3 space-y-3">
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
              <p className="text-xs text-[#6B6560] mb-1">Added</p>
              <p className="text-sm text-[#1B2A4A]">{new Date(product.created_at).toLocaleDateString('en-GB')}</p>
            </div>
            {product.status === 'draft' && (
              <>
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/products/${product.id}/`, { status: 'pending_review' })
                      window.location.reload()
                    } catch { setError('Failed to submit for review') }
                  }}
                  className="w-full mt-2 bg-[#1B2A4A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#2a3d5c] transition"
                >
                  Submit for Review →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right — Details */}
        <div className="col-span-2 space-y-4">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Basic Information</h2>

            {/* Name — read only */}
            <div className="py-3 border-b border-[#F5F4F0]">
              <p className="text-xs text-[#6B6560] mb-1">Product Name (English)</p>
              <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
            </div>
            <div className="py-3 border-b border-[#F5F4F0]">
              <p className="text-xs text-[#6B6560] mb-1">Product Name (Arabic)</p>
              <p className="text-sm font-medium text-[#1B2A4A]" dir="rtl">{product.name_ar}</p>
            </div>

            <Field label="Price (EUR)" field="price" value={product.price} type="number" {...fieldProps} />
            <Field label="Production Cost (EUR)" field="production_cost" value={product.production_cost ?? ''} type="number" {...fieldProps} />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Description</h2>
            <Field label="Description (English)" field="description_en" value={product.description_en} multiline {...fieldProps} />
            <Field label="Description (Arabic)" field="description_ar" value={product.description_ar} multiline {...fieldProps} />
          </div>

          {/* Technical Specs */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Technical Specifications</h2>
            <Field label="Brand" field="brand_name" value={product.brand_name} {...fieldProps} />
            <Field label="Model Number" field="model_number" value={product.model_number} {...fieldProps} />
            <Field label="Material" field="materials" value={product.materials} {...fieldProps} />
            <Field label="Weight (kg)" field="unit_weight_kg" value={product.unit_weight_kg} type="number" {...fieldProps} />
            <Field label="Length (cm)" field="unit_length_cm" value={product.unit_length_cm} type="number" {...fieldProps} />
            <Field label="Width (cm)" field="unit_width_cm" value={product.unit_width_cm} type="number" {...fieldProps} />
            <Field label="Height (cm)" field="unit_height_cm" value={product.unit_height_cm} type="number" {...fieldProps} />
          </div>

          {/* Packaging */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-2">Packaging</h2>
            <Field label="Carton Weight (kg)" field="carton_weight_kg" value={product.carton_weight_kg} type="number" {...fieldProps} />
            <Field label="Carton Length (cm)" field="carton_length_cm" value={product.carton_length_cm} type="number" {...fieldProps} />
            <Field label="Carton Width (cm)" field="carton_width_cm" value={product.carton_width_cm} type="number" {...fieldProps} />
            <Field label="Carton Height (cm)" field="carton_height_cm" value={product.carton_height_cm} type="number" {...fieldProps} />
            <Field label="Units per Carton" field="units_per_carton" value={String(product.units_per_carton)} type="number" {...fieldProps} />
          </div>

          {/* Variants */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1B2A4A]">Variants</h2>
              <button
                onClick={() => setAddingVariant(true)}
                className="text-xs text-[#C8952E] hover:underline"
              >
                + Add Variant
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E0DDDA]">
                  <th className="text-left text-xs text-[#6B6560] pb-2">SKU</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Color</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Size</th>
                  <th className="text-left text-xs text-[#6B6560] pb-2">Barcode</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {product.variants.map(v => (
                  <tr key={v.id} className="border-b border-[#E0DDDA] last:border-0">
                    <td className="py-2 font-mono text-xs text-[#6B6560]">{v.sku || '—'}</td>
                    <td className="py-2">
                      {editingVariant === v.id ? (
                        <input value={variantEdit.color}
                          onChange={e => setVariantEdit(p => ({ ...p, color: e.target.value }))}
                          className="w-20 border border-[#E0DDDA] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B2A4A]"
                        />
                      ) : (
                        <span className="text-[#1B2A4A]">{v.color || '—'}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingVariant === v.id ? (
                        <input value={variantEdit.size}
                          onChange={e => setVariantEdit(p => ({ ...p, size: e.target.value }))}
                          className="w-16 border border-[#E0DDDA] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B2A4A]"
                        />
                      ) : (
                        <span className="text-[#1B2A4A]">{v.size || '—'}</span>
                      )}
                    </td>
                    <td className="py-2 text-[#6B6560] text-xs">{v.external_barcode || '—'}</td>
                    <td className="py-2">
                      {editingVariant === v.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveVariant(v.id)}
                            disabled={saving}
                            className="text-xs bg-[#1B2A4A] text-white px-2 py-1 rounded disabled:opacity-50">
                            Save
                          </button>
                          <button onClick={() => setEditingVariant(null)}
                            className="text-xs text-[#6B6560]">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={() => { setEditingVariant(v.id); setVariantEdit({ color: v.color, size: v.size }) }}
                            className="text-xs text-[#C8952E] hover:underline">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteVariant(v.id)}
                            className="text-xs text-red-400 hover:text-red-600">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Add Variant Row */}
                {addingVariant && (
                  <tr className="border-b border-[#E0DDDA]">
                    <td className="py-2 text-xs text-[#6B6560]">—</td>
                    <td className="py-2">
                      <input value={newVariant.color}
                        onChange={e => setNewVariant(p => ({ ...p, color: e.target.value }))}
                        placeholder="Color"
                        className="w-20 border border-[#E0DDDA] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </td>
                    <td className="py-2">
                      <input value={newVariant.size}
                        onChange={e => setNewVariant(p => ({ ...p, size: e.target.value }))}
                        placeholder="Size"
                        className="w-16 border border-[#E0DDDA] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </td>
                    <td className="py-2">
                      <input value={newVariant.external_barcode}
                        onChange={e => setNewVariant(p => ({ ...p, external_barcode: e.target.value }))}
                        placeholder="Barcode"
                        className="w-28 border border-[#E0DDDA] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button onClick={handleAddVariant} disabled={saving}
                          className="text-xs bg-[#C8952E] text-white px-2 py-1 rounded disabled:opacity-50">
                          Add
                        </button>
                        <button onClick={() => setAddingVariant(false)}
                          className="text-xs text-[#6B6560]">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}