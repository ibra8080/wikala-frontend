'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'
import BarcodeLabels from '@/components/ui/BarcodeLabels'

interface Variant {
  id: number
  color?: string
  size?: string
  sku: string
  external_barcode?: string
}

interface Product {
  id: number
  product_code: string
  name_en: string
  name_ar: string
  price: string
  status: string
  created_at: string
  variants?: Variant[]
  seller_name?: string
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  rejected: 'bg-red-50 text-red-700',
  awaiting_seller_shipment: 'bg-purple-50 text-purple-700',
  in_warehouse_egypt: 'bg-orange-50 text-orange-700',
  in_transit: 'bg-cyan-50 text-cyan-700',
  in_warehouse_germany: 'bg-teal-50 text-teal-700',
  listed: 'bg-green-50 text-green-700',
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

export default function ProductsPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set())
  const [printOpen, setPrintOpen] = useState(false)

  const toggleSku = (sku: string) => {
    setSelectedSkus(prev => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku)
      else next.add(sku)
      return next
    })
  }

  const printItems = products.flatMap(p =>
    (p.variants ?? [])
      .filter(v => v.sku && selectedSkus.has(v.sku))
      .map(v => ({
        sku: v.sku,
        productName: p.name_en,
        color: v.color,
        size: v.size,
        sellerName: p.seller_name,
      }))
  )

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    api.get('/products/')
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false))
  }, [user, _hasHydrated, router])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">My Products</h1>
          <p className="text-sm text-[#6B6560] mt-1">{products.length} products total</p>
        </div>
        <Link
          href="/products/new"
          className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition"
        >
          + Add Product
        </Link>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-16 text-center">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">No products yet</h2>
          <p className="text-sm text-[#6B6560] mb-6">
            Start by adding your first product to Wikala.
          </p>
          <Link
            href="/products/new"
            className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition"
          >
            Add Your First Product
          </Link>
        </div>
      )}

      {/* Products — mobile cards */}
      {products.length > 0 && (
        <div className="md:hidden space-y-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="block bg-white rounded-2xl border border-[#E0DDDA] p-4 hover:border-[#C8952E] transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1B2A4A] truncate">{product.name_en}</p>
                  {product.name_ar && (
                    <p className="text-xs text-[#6B6560] mt-0.5 truncate">{product.name_ar}</p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[product.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[product.status] ?? product.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6B6560]">
                <span className="font-mono">{product.product_code || '—'}</span>
                <span className="text-sm text-[#1B2A4A]">€{product.price}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-[#6B6560]">{new Date(product.created_at).toLocaleDateString('en-GB')}</span>
                <span className="text-[#C8952E]">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {selectedSkus.size > 0 && (
        <div className="hidden md:flex items-center gap-3 mb-3">
          <span className="text-sm text-[#6B6560]">{selectedSkus.size} SKU(s) selected</span>
          <button
            onClick={() => setPrintOpen(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Print selected barcodes
          </button>
          <button
            onClick={() => setSelectedSkus(new Set())}
            className="text-sm text-[#6B6560] hover:text-[#1B2A4A]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Products Table — desktop */}
      {products.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                <th className="px-4 py-4 w-10" />
                <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">
                  Product
                </th>
                <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">
                  Code
                </th>
                <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">
                  Price
                </th>
                <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">
                  Date
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <Fragment key={product.id}>
                <tr
                  className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition"
                >
                  <td className="px-4 py-4">
                    {(product.variants?.length ?? 0) > 0 && (
                      <button
                        onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                        className="text-[#6B6560] hover:text-[#1B2A4A] transition"
                        title="Show variants"
                      >
                        {expandedId === product.id ? '▾' : '▸'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1B2A4A]">{product.name_en}</p>
                    <p className="text-xs text-[#6B6560] mt-0.5">{product.name_ar}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-[#6B6560]">
                      {product.product_code || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1B2A4A]">€{product.price}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[product.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#6B6560]">
                      {new Date(product.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-sm text-[#C8952E] hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
                {expandedId === product.id && (product.variants?.length ?? 0) > 0 && (
                  <tr className="bg-[#FAFAF8] border-b border-[#E0DDDA]">
                    <td />
                    <td colSpan={6} className="px-6 py-3">
                      <div className="space-y-2">
                        {product.variants!.filter(v => v.sku).map(v => (
                          <label key={v.id} className="flex items-center gap-3 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSkus.has(v.sku)}
                              onChange={() => toggleSku(v.sku)}
                            />
                            <span className="font-mono text-xs text-[#1B2A4A]">{v.sku}</span>
                            <span className="text-xs text-[#6B6560]">
                              {[v.color, v.size].filter(Boolean).join(' / ') || '—'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BarcodeLabels
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        items={printItems}
      />
    </div>
  )
}