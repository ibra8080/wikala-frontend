'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Variant {
  id: number
  sku: string
  color: string
  size: string
}

interface Product {
  id: number
  product_code: string
  name_en: string
  units_per_carton: number | null
  status: string
  variants: Variant[]
}

interface RequestItem {
  variant_id: number
  variant_sku: string
  product_name: string
  product_code: string
  color: string
  size: string
  cartons_count: number
  units_per_carton: number
  total_units: number
}

export default function NewShipmentRequestPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    available_from: '',
    notes: '',
    delivery_method: 'drop_off',
    delivery_address: '',
    contact_person: '',
    contact_number: '',
  })

  const [items, setItems] = useState<RequestItem[]>([])
  const [selectedVariant, setSelectedVariant] = useState('')
  const [cartonsCount, setCartonsCount] = useState(1)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products/')
      const eligible = res.data.filter(
        (p: Product) => ['approved', 'awaiting_seller_shipment'].includes(p.status)
      )
      setProducts(eligible)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    void fetchProducts()
  }, [user, _hasHydrated, router, fetchProducts])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Build a flat list of all variants across eligible products
  const allVariants = products.flatMap(p =>
    p.variants.map(v => ({ ...v, product: p }))
  )

  const addItem = () => {
    const variantId = parseInt(selectedVariant)
    const entry = allVariants.find(v => v.id === variantId)
    if (!entry) return
    if (items.find(i => i.variant_id === variantId)) {
      setError('This variant is already added.')
      return
    }
    const unitsPerCarton = entry.product.units_per_carton ?? 0
    setItems(prev => [...prev, {
      variant_id: entry.id,
      variant_sku: entry.sku || '—',
      product_name: entry.product.name_en,
      product_code: entry.product.product_code,
      color: entry.color || '—',
      size: entry.size || '—',
      cartons_count: cartonsCount,
      units_per_carton: unitsPerCarton,
      total_units: cartonsCount * unitsPerCarton,
    }])
    setSelectedVariant('')
    setCartonsCount(1)
    setError('')
  }

  const removeItem = (variantId: number) => {
    setItems(prev => prev.filter(i => i.variant_id !== variantId))
  }

  const updateCartons = (variantId: number, count: number) => {
    setItems(prev => prev.map(i =>
      i.variant_id === variantId
        ? { ...i, cartons_count: count, total_units: count * i.units_per_carton }
        : i
    ))
  }

  const handleSubmit = async (asDraft: boolean) => {
    if (!form.available_from) { setError('Please select availability date.'); return }
    if (!form.contact_person) { setError('Please enter contact person name.'); return }
    if (!form.contact_number) { setError('Please enter contact number.'); return }
    if (form.delivery_method === 'pickup' && !form.delivery_address) {
      setError('Please enter delivery address for pickup.'); return
    }
    if (items.length === 0) { setError('Please add at least one variant.'); return }

    setSubmitting(true)
    setError('')
    try {
      await api.post('/inventory/shipment-requests/', {
        available_from: form.available_from,
        status: asDraft ? 'draft' : 'submitted',
        notes: form.notes,
        delivery_method: form.delivery_method,
        delivery_address: form.delivery_method === 'pickup' ? form.delivery_address : '',
        contact_person: form.contact_person,
        contact_number: form.contact_number,
        items: items.map(i => ({
          variant: i.variant_id,
          cartons_count: i.cartons_count,
        })),
      })
      router.push('/inventory')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCartons = items.reduce((sum, i) => sum + i.cartons_count, 0)
  const totalUnits = items.reduce((sum, i) => sum + i.total_units, 0)

  const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <Link href="/inventory" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">
          ← Back to Shipment Requests
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">New Shipment Request</h1>
      <p className="text-sm text-[#6B6560] mb-8">
        Select the product variants (SKUs) you want to ship and specify carton quantities.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">

          {/* Availability & Delivery */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 space-y-5">
            <h2 className="font-semibold text-[#1B2A4A]">Availability & Delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Available From <span className="text-red-400">*</span>
                </label>
                <input type="date" name="available_from" value={form.available_from}
                  onChange={handleChange} min={new Date().toISOString().split('T')[0]}
                  className={inputClass} />
                <p className="text-xs text-[#6B6560] mt-1">Earliest date we can collect your products</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Delivery Method <span className="text-red-400">*</span>
                </label>
                <select name="delivery_method" value={form.delivery_method} onChange={handleChange} className={inputClass}>
                  <option value="drop_off">Drop off at Wikala Warehouse</option>
                  <option value="pickup">Request pickup from your location</option>
                </select>
              </div>
            </div>
            {form.delivery_method === 'pickup' && (
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Pickup Address <span className="text-red-400">*</span>
                </label>
                <textarea name="delivery_address" value={form.delivery_address}
                  onChange={handleChange} rows={2} placeholder="Full address for pickup..."
                  className={inputClass + ' resize-none'} />
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 space-y-5">
            <h2 className="font-semibold text-[#1B2A4A]">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Responsible Person <span className="text-red-400">*</span>
                </label>
                <input name="contact_person" value={form.contact_person}
                  onChange={handleChange} placeholder="Full name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Contact Number <span className="text-red-400">*</span>
                </label>
                <input name="contact_number" value={form.contact_number}
                  onChange={handleChange} placeholder="+20 xxx xxx xxxx" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Additional Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={2} placeholder="Any special instructions or notes..."
                className={inputClass + ' resize-none'} />
            </div>
          </div>

          {/* Products / Variants */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-4">Products — Select by SKU</h2>

            {allVariants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#6B6560]">
                  No products available for shipment. Products must be in
                  <span className="font-medium text-[#1B2A4A]"> Approved</span> or
                  <span className="font-medium text-[#1B2A4A]"> Awaiting Shipment</span> status.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 mb-4">
                <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)}
                  className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition">
                  <option value="">Select a variant (SKU)...</option>
                  {allVariants
                    .filter(v => !items.find(i => i.variant_id === v.id))
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.product.name_en} — {v.color}{v.size ? ` / ${v.size}` : ''} — {v.sku || 'No SKU'}
                      </option>
                    ))}
                </select>
                <input type="number" value={cartonsCount}
                  onChange={e => setCartonsCount(parseInt(e.target.value) || 1)}
                  min={1} placeholder="Cartons"
                  className="w-28 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition" />
                <button onClick={addItem} disabled={!selectedVariant}
                  className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-40 transition">
                  Add
                </button>
              </div>
            )}

            {items.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0DDDA]">
                    <th className="text-left text-xs text-[#6B6560] pb-2">Product</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">SKU</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Color / Size</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Cartons</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Units/Carton</th>
                    <th className="text-left text-xs text-[#6B6560] pb-2">Total</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.variant_id} className="border-b border-[#E0DDDA] last:border-0">
                      <td className="py-3 text-[#1B2A4A] font-medium">{item.product_name}</td>
                      <td className="py-3 font-mono text-xs text-[#6B6560]">{item.variant_sku}</td>
                      <td className="py-3 text-[#6B6560] text-xs">{item.color}{item.size !== '—' ? ` / ${item.size}` : ''}</td>
                      <td className="py-3">
                        <input type="number" value={item.cartons_count}
                          onChange={e => updateCartons(item.variant_id, parseInt(e.target.value) || 1)}
                          min={1}
                          className="w-20 border border-[#E0DDDA] rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#1B2A4A]" />
                      </td>
                      <td className="py-3 text-[#6B6560]">{item.units_per_carton}</td>
                      <td className="py-3 font-semibold text-[#1B2A4A]">{item.total_units}</td>
                      <td className="py-3">
                        <button onClick={() => removeItem(item.variant_id)}
                          className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => handleSubmit(true)} disabled={submitting}
              className="border border-[#E0DDDA] text-[#1B2A4A] px-6 py-2.5 rounded-lg text-sm font-medium hover:border-[#1B2A4A] disabled:opacity-40 transition">
              Save as Draft
            </button>
            <button onClick={() => handleSubmit(false)}
              disabled={submitting || items.length === 0 || !form.available_from || !form.contact_person || !form.contact_number}
              className="bg-[#C8952E] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-40 transition">
              {submitting ? 'Submitting...' : 'Submit Request →'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 sticky top-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6560]">SKUs</span>
                <span className="font-medium text-[#1B2A4A]">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6560]">Total Cartons</span>
                <span className="font-medium text-[#1B2A4A]">{totalCartons}</span>
              </div>
              <div className="border-t border-[#E0DDDA] pt-3 flex justify-between text-sm">
                <span className="text-[#6B6560]">Total Units</span>
                <span className="font-bold text-[#1B2A4A] text-base">{totalUnits}</span>
              </div>
            </div>

            {form.available_from && (
              <div className="mt-4 pt-4 border-t border-[#E0DDDA]">
                <p className="text-xs text-[#6B6560] mb-1">Available From</p>
                <p className="text-sm font-medium text-[#1B2A4A]">
                  {new Date(form.available_from).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#E0DDDA]">
              <p className="text-xs text-[#6B6560] mb-1">Delivery Method</p>
              <p className="text-sm font-medium text-[#1B2A4A]">
                {form.delivery_method === 'drop_off' ? 'Drop off at Wikala Warehouse' : 'Pickup from your location'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}