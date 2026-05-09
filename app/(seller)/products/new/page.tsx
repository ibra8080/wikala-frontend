'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import Link from 'next/link'

interface Variant {
  color: string
  size: string
  external_barcode: string
  quantity_submitted: number
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    price: '',
    weight_kg: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    category: '',
  })

  const [variants, setVariants] = useState<Variant[]>([
    { color: '', size: '', external_barcode: '', quantity_submitted: 1 }
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const addVariant = () => {
    setVariants(prev => [...prev, { color: '', size: '', external_barcode: '', quantity_submitted: 1 }])
  }

  const removeVariant = (index: number) => {
    if (variants.length === 1) return
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const productRes = await api.post('/products/', {
        name_en: form.name_en,
        name_ar: form.name_ar,
        description_en: form.description_en,
        description_ar: form.description_ar,
        price: parseFloat(form.price),
        weight_kg: parseFloat(form.weight_kg),
        length_cm: parseFloat(form.length_cm),
        width_cm: parseFloat(form.width_cm),
        height_cm: parseFloat(form.height_cm),
      })

      const productId = productRes.data.id
      console.log('Product ID:', productId)

      for (const variant of variants) {
        await api.post(`/products/${productId}/variants/`, {
          ...variant,
          quantity_submitted: parseInt(String(variant.quantity_submitted)),
        })
      }

      router.push('/products')
    } catch {
      setError('Something went wrong. Please check your inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/products" className="text-[#6B6560] hover:text-[#1B2A4A] transition text-sm">
          ← Back to Products
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Add New Product</h1>
      <p className="text-sm text-[#6B6560] mb-8">
        Fill in the product details. Our team will review and approve your product.
      </p>

      {/* Steps */}
      <div className="flex gap-2 mb-8">
        {['Product Info', 'Dimensions', 'Variants'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer
              ${step === i + 1
                ? 'bg-[#1B2A4A] text-white'
                : step > i + 1
                  ? 'bg-[#EEECEA] text-[#1B2A4A]'
                  : 'bg-[#F5F4F0] text-[#6B6560]'
              }`}
              onClick={() => step > i + 1 && setStep(i + 1)}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                ${step === i + 1 ? 'bg-[#C8952E] text-white' : 'bg-white/20 text-current'}`}>
                {i + 1}
              </span>
              {s}
            </div>
            {i < 2 && <span className="text-[#E0DDDA]">→</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-8">

        {/* Step 1 — Product Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Product Name (English) <span className="text-red-400">*</span>
                </label>
                <input
                  name="name_en"
                  value={form.name_en}
                  onChange={handleChange}
                  placeholder="e.g. Men's Cotton Galabeya"
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Product Name (Arabic) <span className="text-red-400">*</span>
                </label>
                <input
                  name="name_ar"
                  value={form.name_ar}
                  onChange={handleChange}
                  placeholder="مثال: جلباب قطني رجالي"
                  dir="rtl"
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Description (English)
                </label>
                <textarea
                  name="description_en"
                  value={form.description_en}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your product in English..."
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Description (Arabic)
                </label>
                <textarea
                  name="description_ar"
                  value={form.description_ar}
                  onChange={handleChange}
                  rows={4}
                  dir="rtl"
                  placeholder="اكتب وصف المنتج بالعربية..."
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Price (EUR) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] text-sm">€</span>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition pr-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                >
                  <option value="">Select category...</option>
                  <option value="apparel">Apparel</option>
                  <option value="textiles">Textiles & Home Linens</option>
                  <option value="gifts">Gifts & Décor</option>
                  <option value="cosmetics">Cosmetics & Beauty</option>
                  <option value="handmade">Handmade & Artisan</option>
                  <option value="leather">Leather Goods & Footwear</option>
                  <option value="electronics">Electronics</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!form.name_en || !form.name_ar || !form.price}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-40 transition"
              >
                Next: Dimensions →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Dimensions */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-[#6B6560] mb-4">
              Dimensions and weight are required for shipping cost calculation.
            </p>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Weight (kg) <span className="text-red-400">*</span>
                </label>
                <input
                  name="weight_kg"
                  type="number"
                  value={form.weight_kg}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Length (cm) <span className="text-red-400">*</span>
                </label>
                <input
                  name="length_cm"
                  type="number"
                  value={form.length_cm}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Width (cm) <span className="text-red-400">*</span>
                </label>
                <input
                  name="width_cm"
                  type="number"
                  value={form.width_cm}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Height (cm) <span className="text-red-400">*</span>
                </label>
                <input
                  name="height_cm"
                  type="number"
                  value={form.height_cm}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="border border-[#E0DDDA] text-[#6B6560] px-6 py-2.5 rounded-lg text-sm font-medium hover:border-[#1B2A4A] hover:text-[#1B2A4A] transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.weight_kg || !form.length_cm || !form.width_cm || !form.height_cm}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-40 transition"
              >
                Next: Variants →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Variants */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-[#6B6560]">
              Add at least one variant. If your product has no color or size options, leave those fields empty.
            </p>

            {variants.map((variant, index) => (
              <div key={index} className="border border-[#E0DDDA] rounded-xl p-5 relative">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-medium text-[#1B2A4A]">Variant {index + 1}</p>
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariant(index)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Color</label>
                    <input
                      value={variant.color}
                      onChange={e => handleVariantChange(index, 'color', e.target.value)}
                      placeholder="e.g. White"
                      className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Size</label>
                    <input
                      value={variant.size}
                      onChange={e => handleVariantChange(index, 'size', e.target.value)}
                      placeholder="e.g. L"
                      className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Barcode (EAN)</label>
                    <input
                      value={variant.external_barcode}
                      onChange={e => handleVariantChange(index, 'external_barcode', e.target.value)}
                      placeholder="Optional"
                      className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Quantity</label>
                    <input
                      type="number"
                      value={variant.quantity_submitted}
                      onChange={e => handleVariantChange(index, 'quantity_submitted', e.target.value)}
                      min={1}
                      className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addVariant}
              className="w-full border border-dashed border-[#C8952E] text-[#C8952E] rounded-xl py-3 text-sm font-medium hover:bg-[#F5F4F0] transition"
            >
              + Add Another Variant
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="border border-[#E0DDDA] text-[#6B6560] px-6 py-2.5 rounded-lg text-sm font-medium hover:border-[#1B2A4A] hover:text-[#1B2A4A] transition"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#C8952E] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-40 transition"
              >
                {loading ? 'Submitting...' : 'Submit Product →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}