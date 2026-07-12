'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Product {
  id: number
  product_code: string
  name_en: string
  name_ar: string
  price: string
  status: string
  created_at: string
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

      {/* Products Table — desktop */}
      {products.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
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
                <tr
                  key={product.id}
                  className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition"
                >
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}