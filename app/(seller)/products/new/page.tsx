'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import Link from 'next/link'

interface Variant {
  color: string
  size: string
  external_barcode: string
}

interface CustomSpec {
  key: string
  value: string
}

interface ProductImage {
  file: File
  preview: string
  uploading: boolean
  url?: string
}

const steps = ['Product Info', 'Technical Specs', 'Packaging', 'Variants']

const FIELD_LABELS: Record<string, string> = {
  name_ar: 'Arabic product name',
  name_en: 'English product name',
  name_de: 'German product name',
  description_ar: 'Arabic description',
  description_en: 'English description',
  description_de: 'German description',
  price: 'Price',
  category: 'Category',
  unit_weight_kg: 'Item weight',
  unit_length_cm: 'Item length',
  unit_width_cm: 'Item width',
  unit_height_cm: 'Item height',
  variants: 'Variants',
  images: 'Images',
}

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Something went wrong. Please check your inputs and try again.'
  }
  const messages: string[] = []
  for (const [field, value] of Object.entries(data as Record<string, unknown>)) {
    const label = FIELD_LABELS[field] || field
    if (Array.isArray(value)) {
      messages.push(`${label}: ${value.join(' ')}`)
    } else if (typeof value === 'string') {
      messages.push(`${label}: ${value}`)
    }
  }
  return messages.length > 0
    ? messages.join(' • ')
    : 'Something went wrong. Please check your inputs and try again.'
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<{ id: number; name_en: string; name_ar: string }[]>([])

  useEffect(() => {
    api.get('/products/categories/')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
  }, [])

  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    name_de: '',
    description_en: '',
    description_ar: '',
    description_de: '',
    price: '',
    category: '',
    // Technical specs
    unit_length_cm: '',
    unit_width_cm: '',
    unit_height_cm: '',
    unit_weight_kg: '',
    brand_name: '',
    model_number: '',
    materials: '',
    // Packaging - inner
    inner_weight_kg: '',
    inner_length_cm: '',
    inner_width_cm: '',
    inner_height_cm: '',
    // Packaging - carton
    carton_weight_kg: '',
    carton_length_cm: '',
    carton_width_cm: '',
    carton_height_cm: '',
    units_per_carton: '',
  })

  const [images, setImages] = useState<ProductImage[]>([])
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([])
  const [variants, setVariants] = useState<Variant[]>([
    { color: '', size: '', external_barcode: '' }
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Images
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB

    // حد أقصى 10 صور
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed per product.')
      e.target.value = ''
      return
    }

    for (const file of files) {
      // فحص الصيغة لحظة الاختيار (يرفض AVIF/HEIC وأي صيغة غير مدعومة)
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported format. Please use JPG, PNG, or WebP. (AVIF and HEIC are not supported — change your camera setting to "Most Compatible" or convert the image first.)`)
        e.target.value = ''
        return
      }
      // فحص الحجم
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" exceeds the 5MB limit. Please compress the image and try again.`)
        e.target.value = ''
        return
      }
    }

    const newImages: ProductImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }))
    setImages(prev => [...prev, ...newImages])
    setError('')
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (productId: number) => {
    for (let i = 0; i < images.length; i++) {
      if (images[i].url) continue
      const formData = new FormData()
      formData.append('image', images[i].file)
      await api.post(`/products/${productId}/images/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
  }

  // Custom Specs
  const addCustomSpec = () => {
    if (customSpecs.length >= 4) return
    setCustomSpecs(prev => [...prev, { key: '', value: '' }])
  }

  const updateCustomSpec = (index: number, field: 'key' | 'value', value: string) => {
    setCustomSpecs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const removeCustomSpec = (index: number) => {
    setCustomSpecs(prev => prev.filter((_, i) => i !== index))
  }

  // Variants
  const handleVariantChange = (index: number, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const addVariant = () => {
    setVariants(prev => [...prev, { color: '', size: '', external_barcode: '' }])
  }

  const removeVariant = (index: number) => {
    if (variants.length === 1) return
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (submitForReview: boolean) => {
    setLoading(true)
    setError('')
    try {
      const productRes = await api.post('/products/', {
        name_en: form.name_en,
        name_ar: form.name_ar,
        name_de: form.name_de || '',
        description_en: form.description_en || '',
        description_ar: form.description_ar || '',
        description_de: form.description_de || '',
        price: parseFloat(form.price),
        category: form.category ? parseInt(form.category) : null,
        brand_name: form.brand_name,
        model_number: form.model_number,
        materials: form.materials,
        unit_length_cm: form.unit_length_cm ? parseFloat(form.unit_length_cm) : null,
        unit_width_cm: form.unit_width_cm ? parseFloat(form.unit_width_cm) : null,
        unit_height_cm: form.unit_height_cm ? parseFloat(form.unit_height_cm) : null,
        unit_weight_kg: form.unit_weight_kg ? parseFloat(form.unit_weight_kg) / 1000 : null,
        inner_weight_kg: form.inner_weight_kg ? parseFloat(form.inner_weight_kg) / 1000 : null,
        inner_length_cm: form.inner_length_cm ? parseFloat(form.inner_length_cm) : null,
        inner_width_cm: form.inner_width_cm ? parseFloat(form.inner_width_cm) : null,
        inner_height_cm: form.inner_height_cm ? parseFloat(form.inner_height_cm) : null,
        carton_weight_kg: form.carton_weight_kg ? parseFloat(form.carton_weight_kg) : null,
        carton_length_cm: form.carton_length_cm ? parseFloat(form.carton_length_cm) : null,
        carton_width_cm: form.carton_width_cm ? parseFloat(form.carton_width_cm) : null,
        carton_height_cm: form.carton_height_cm ? parseFloat(form.carton_height_cm) : null,
        units_per_carton: form.units_per_carton ? parseInt(form.units_per_carton) : null,
        custom_specs: customSpecs.filter(s => s.key && s.value),
        variants: variants.map(v => ({
          color: v.color,
          size: v.size,
          external_barcode: v.external_barcode,
          quantity_submitted: 0,
        })),
      })
      const productId = productRes.data.id
      if (images.length > 0) {
        await uploadImages(productId)
      }
      if (submitForReview) {
        await api.patch(`/products/${productId}/`, { status: 'pending_review' })
      }
      router.push('/products')
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown }, message?: string }
      setError(parseApiError(e.response?.data))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

  return (
    <div>
      <div className="mb-6">
        <Link href="/products" className="text-[#6B6560] hover:text-[#1B2A4A] transition text-sm">
          ← Back to Products
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Add New Product</h1>
      <p className="text-sm text-[#6B6560] mb-8">
        Fill in the product details. Our team will review and approve your product.
      </p>

      {/* Steps */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                ${step === i + 1 ? 'bg-[#1B2A4A] text-white' : step > i + 1 ? 'bg-[#EEECEA] text-[#1B2A4A]' : 'bg-[#F5F4F0] text-[#6B6560]'}`}
              onClick={() => step > i + 1 && setStep(i + 1)}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                ${step === i + 1 ? 'bg-[#C8952E] text-white' : 'bg-white/20'}`}>
                {i + 1}
              </span>
              {s}
            </div>
            {i < steps.length - 1 && <span className="text-[#E0DDDA]">→</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-8">

        {/* Step 1 — Product Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Product Name (English) <span className="text-red-400">*</span>
                </label>
                <input name="name_en" value={form.name_en} onChange={handleChange}
                  placeholder="e.g. Men's Cotton Galabeya" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Product Name (Arabic) <span className="text-red-400">*</span>
                </label>
                <input name="name_ar" value={form.name_ar} onChange={handleChange}
                  placeholder="مثال: جلباب قطني رجالي" dir="rtl" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Product Name (German) <span className="text-[#6B6560] text-xs font-normal">optional</span>
                </label>
                <input name="name_de" value={form.name_de} onChange={handleChange}
                  placeholder="z.B. Herren-Baumwoll-Galabeya" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Description (English) <span className="text-[#6B6560] text-xs font-normal">optional</span>
                </label>
                <textarea name="description_en" value={form.description_en} onChange={handleChange}
                  rows={4} placeholder="Describe your product..." className={inputClass + ' resize-none'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Description (Arabic) <span className="text-red-400">*</span>
                </label>
                <textarea name="description_ar" value={form.description_ar} onChange={handleChange}
                  rows={4} dir="rtl" placeholder="اكتب وصف المنتج..." className={inputClass + ' resize-none'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Description (German) <span className="text-[#6B6560] text-xs font-normal">optional</span>
                </label>
                <textarea name="description_de" value={form.description_de} onChange={handleChange}
                  rows={4} placeholder="Produkt beschreiben..." className={inputClass + ' resize-none'} />
              </div>
            </div>

            <div className="bg-[#F5F4F0] border border-[#E0DDDA] rounded-lg px-4 py-3">
              <p className="text-sm text-[#6B6560]">
                <span className="text-[#C8952E]">ℹ</span> Only the Arabic description is required. If English or German is left empty, Wikala will translate it for you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Price (EUR) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] text-sm">€</span>
                  <input name="price" type="number" value={form.price} onChange={handleChange}
                    placeholder="0.00" className={inputClass + ' pr-8'} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                Product Images <span className="text-[#6B6560] font-normal">(min 1, max 10)</span>
              </label>
              <div className="grid grid-cols-6 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#E0DDDA] group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#E0DDDA] hover:border-[#C8952E] transition flex flex-col items-center justify-center text-[#6B6560] hover:text-[#C8952E]"
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-xs mt-1">Add Photo</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              <div className="mt-3 bg-[#F5F4F0] rounded-xl px-4 py-3 border border-[#E0DDDA]">
                <p className="text-xs font-semibold text-[#1B2A4A] mb-1">📷 Image Guidelines</p>
                <ul className="text-xs text-[#6B6560] space-y-0.5">
                  <li>• Max 10 images per product, max 5MB per image</li>
                  <li>• Recommended size: 2048 × 2048 px (square 1:1)</li>
                  <li>• Formats: JPG, PNG, WebP</li>
                  <li>• White or neutral background preferred</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setStep(2)}
                disabled={!form.name_en || !form.name_ar || !form.description_ar.trim() || !form.price || images.length === 0}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-40 transition">
                Next: Technical Specs →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Technical Specs */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#1B2A4A] mb-4">
                Item Dimensions <span className="text-red-400">*</span>
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Length (cm)</label>
                  <input name="unit_length_cm" type="number" value={form.unit_length_cm}
                    onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Width (cm)</label>
                  <input name="unit_width_cm" type="number" value={form.unit_width_cm}
                    onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Height (cm)</label>
                  <input name="unit_height_cm" type="number" value={form.unit_height_cm}
                    onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Weight (g) <span className="text-red-400">*</span></label>
                  <input name="unit_weight_kg" type="number" value={form.unit_weight_kg}
                    onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1B2A4A] mb-4">Product Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Brand</label>
                  <input name="brand_name" value={form.brand_name} onChange={handleChange}
                    placeholder="Optional" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Model Number</label>
                  <input name="model_number" value={form.model_number} onChange={handleChange}
                    placeholder="Optional" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1.5">Material</label>
                  <input name="materials" value={form.materials} onChange={handleChange}
                    placeholder="e.g. 100% Cotton" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Custom Specs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1B2A4A]">Additional Specifications</h3>
                {customSpecs.length < 4 && (
                  <button onClick={addCustomSpec}
                    className="text-sm text-[#C8952E] hover:underline">
                    + Add Spec
                  </button>
                )}
              </div>
              {customSpecs.length === 0 && (
                <p className="text-sm text-[#6B6560]">
                  You can add up to 4 additional specifications (e.g. Care Instructions, Country of Origin).
                </p>
              )}
              <div className="space-y-3">
                {customSpecs.map((spec, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 items-center">
                    <input value={spec.key} onChange={e => updateCustomSpec(i, 'key', e.target.value)}
                      placeholder="Spec name (e.g. Care Instructions)" className={inputClass} />
                    <div className="flex gap-2">
                      <input value={spec.value} onChange={e => updateCustomSpec(i, 'value', e.target.value)}
                        placeholder="Value" className={inputClass} />
                      <button onClick={() => removeCustomSpec(i)}
                        className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)}
                className="border border-[#E0DDDA] text-[#6B6560] px-6 py-2.5 rounded-lg text-sm hover:border-[#1B2A4A] hover:text-[#1B2A4A] transition">
                ← Back
              </button>
              <button onClick={() => setStep(3)}
                disabled={!form.unit_length_cm || !form.unit_width_cm || !form.unit_height_cm || !form.unit_weight_kg}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-40 transition">
                Next: Packaging →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Packaging */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#1B2A4A] mb-1">Inner Packaging (per unit)</h3>
              <p className="text-xs text-[#6B6560] mb-4">Dimensions and weight of the product in its individual packaging.</p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'inner_length_cm', label: 'Length (cm)' },
                  { name: 'inner_width_cm', label: 'Width (cm)' },
                  { name: 'inner_height_cm', label: 'Height (cm)' },
                  { name: 'inner_weight_kg', label: 'Weight (g)' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-xs text-[#6B6560] mb-1.5">{field.label}</label>
                    <input name={field.name} type="number"
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange} placeholder="0" className={inputClass} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1B2A4A] mb-1">Outer Packaging (carton)</h3>
              <p className="text-xs text-[#6B6560] mb-4">Dimensions and weight of the full export carton.</p>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { name: 'carton_length_cm', label: 'Length (cm)' },
                  { name: 'carton_width_cm', label: 'Width (cm)' },
                  { name: 'carton_height_cm', label: 'Height (cm)' },
                  { name: 'carton_weight_kg', label: 'Weight (kg)' },
                  { name: 'units_per_carton', label: 'Units per Carton' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-xs text-[#6B6560] mb-1.5">{field.label}</label>
                    <input name={field.name} type="number"
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange} placeholder="0" className={inputClass} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)}
                className="border border-[#E0DDDA] text-[#6B6560] px-6 py-2.5 rounded-lg text-sm hover:border-[#1B2A4A] hover:text-[#1B2A4A] transition">
                ← Back
              </button>
              <button onClick={() => setStep(4)}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
                Next: Variants →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Variants */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-[#6B6560]">
              Add at least one variant. If your product has no color or size variations, add a single variant and leave the color and size fields empty — this will represent the default version of your product and allow you to assign a barcode to it.
            </p>

            {variants.map((variant, index) => (
              <div key={index} className="border border-[#E0DDDA] rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-medium text-[#1B2A4A]">Variant {index + 1}</p>
                  {variants.length > 1 && (
                    <button onClick={() => removeVariant(index)}
                      className="text-xs text-red-400 hover:text-red-600 transition">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Color</label>
                    <input value={variant.color}
                      onChange={e => handleVariantChange(index, 'color', e.target.value)}
                      placeholder="e.g. White" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Size</label>
                    <input value={variant.size}
                      onChange={e => handleVariantChange(index, 'size', e.target.value)}
                      placeholder="e.g. L" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1.5">Barcode (EAN)</label>
                    <input value={variant.external_barcode}
                      onChange={e => handleVariantChange(index, 'external_barcode', e.target.value)}
                      placeholder="Optional" className={inputClass} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addVariant}
              className="w-full border border-dashed border-[#C8952E] text-[#C8952E] rounded-xl py-3 text-sm font-medium hover:bg-[#F5F4F0] transition">
              + Add Another Variant
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="bg-[#F5F4F0] border border-[#E0DDDA] rounded-lg px-4 py-3">
              <p className="text-xs text-[#6B6560]">
                <span className="text-[#C8952E]">ℹ</span> <strong>Save as Draft</strong> keeps the product private so you can edit it later. <strong>Submit for Approval</strong> sends it to Wikala&apos;s team for review.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(3)}
                className="border border-[#E0DDDA] text-[#6B6560] px-6 py-2.5 rounded-lg text-sm hover:border-[#1B2A4A] hover:text-[#1B2A4A] transition">
                ← Back
              </button>
              <div className="flex gap-3">
                <button onClick={() => handleSubmit(false)} disabled={loading}
                  className="border border-[#1B2A4A] text-[#1B2A4A] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F5F4F0] disabled:opacity-40 transition">
                  {loading ? 'Saving...' : 'Save as Draft'}
                </button>
                <button onClick={() => handleSubmit(true)} disabled={loading}
                  className="bg-[#C8952E] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-40 transition">
                  {loading ? 'Submitting...' : 'Submit for Approval →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}