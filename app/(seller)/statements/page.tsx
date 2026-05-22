'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface Product {
  id: number
  product_code: string
  name_en: string
  price: string
  production_cost: string | null
  unit_length_cm: string
  unit_width_cm: string
  unit_height_cm: string
  status: string
}

interface InventoryItem {
  id: number
  variant_sku: string
  quantity_in_germany: number
  quantity_sold: number
  quantity_available: number
  arrived_germany_at: string | null
}

interface Statement {
  id: number
  period_start: string
  period_end: string
  total_sales: string
  net_amount: string
  status: string
  created_at: string
}

interface SkuRow {
  sku: string
  product_name: string
  product_code: string
  units_available: number
  units_sold: number
  price: number
  production_cost: number
  storage_cost: number
  wikala_fee: number
  vat: number
  profit: number
}

export default function StatementsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'statements'>('overview')

  const fetchAll = useCallback(async () => {
    try {
      const [prodRes, invRes, stmtRes] = await Promise.all([
        api.get('/products/'),
        api.get('/inventory/'),
        api.get('/finance/statements/'),
      ])
      setProducts(prodRes.data)
      setInventory(invRes.data)
      setStatements(stmtRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    void fetchAll()
  }, [user, router, fetchAll])

  // حساب تكلفة التخزين لكل SKU
  const calcStorageCost = (product: Product, inv: InventoryItem): number => {
    if (!inv.arrived_germany_at || inv.quantity_in_germany === 0) return 0
    const arrivedAt = new Date(inv.arrived_germany_at)
    const now = new Date()
    const days = (now.getTime() - arrivedAt.getTime()) / (1000 * 60 * 60 * 24)
    const months = days / 30
    const l = parseFloat(product.unit_length_cm) / 100
    const w = parseFloat(product.unit_width_cm) / 100
    const h = parseFloat(product.unit_height_cm) / 100
    const volumeM3 = l * w * h * 1.15 // +15% فراغ
    return 25 * volumeM3 * inv.quantity_in_germany * months
  }

  // بناء جدول المتابعة
  const buildRows = (): SkuRow[] => {
    const rows: SkuRow[] = []

    for (const inv of inventory) {
      const product = products.find(p =>
        p.product_code && inv.variant_sku?.startsWith(p.product_code)
      )
      if (!product) continue

      const price = parseFloat(product.price)
      const productionCost = parseFloat(product.production_cost ?? '0') || 0
      const storageCost = calcStorageCost(product, inv)
      const wikalaFee = (price * 0.15) + 1
      const vat = price * 0.19
      const totalCosts = productionCost + storageCost + wikalaFee + vat
      const profit = price - totalCosts

      rows.push({
        sku: inv.variant_sku,
        product_name: product.name_en,
        product_code: product.product_code,
        units_available: inv.quantity_available,
        units_sold: inv.quantity_sold,
        price,
        production_cost: productionCost,
        storage_cost: storageCost,
        wikala_fee: wikalaFee,
        vat,
        profit,
      })
    }

    return rows
  }

  const rows = buildRows()

  const fmt = (n: number) => `€${n.toFixed(2)}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Statements</h1>
        <p className="text-sm text-[#6B6560] mt-1">Track your product performance and monthly settlements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${activeTab === 'overview' ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
          Performance Overview
        </button>
        <button onClick={() => setActiveTab('statements')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${activeTab === 'statements' ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
          Monthly Statements
          <span className="ml-2 text-xs opacity-70">{statements.length}</span>
        </button>
      </div>

      {/* Tab: Performance Overview */}
      {activeTab === 'overview' && (
        <div>
          {rows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-16 text-center">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-lg font-semibold text-[#1B2A4A] mb-2">No data yet</p>
              <p className="text-sm text-[#6B6560]">
                Performance data will appear once your products arrive in Germany.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-x-auto mb-4">
                <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
                  <thead>
                    <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                      {[
                        'Product', 'SKU', 'Units Available', 'Units Sold',
                        'Production Cost', 'Storage Cost', 'Wikala Fee (15%+1)',
                        'VAT (19%)', 'Final Price', 'Est. Profit'
                      ].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.sku} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1B2A4A] whitespace-nowrap">{row.product_name}</p>
                          <p className="text-xs text-[#6B6560] font-mono">{row.product_code}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#6B6560]">{row.sku}</td>
                        <td className="px-4 py-3 font-semibold text-[#1B2A4A]">{row.units_available}</td>
                        <td className="px-4 py-3 text-[#6B6560]">{row.units_sold}</td>
                        <td className="px-4 py-3 text-[#6B6560]">{fmt(row.production_cost)}</td>
                        <td className="px-4 py-3 text-[#6B6560]">{fmt(row.storage_cost)}</td>
                        <td className="px-4 py-3 text-[#6B6560]">{fmt(row.wikala_fee)}</td>
                        <td className="px-4 py-3 text-[#6B6560]">{fmt(row.vat)}</td>
                        <td className="px-4 py-3 font-semibold text-[#1B2A4A]">{fmt(row.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {fmt(row.profit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[#6B6560] bg-[#F5F4F0] rounded-xl px-4 py-3 border border-[#E0DDDA]">
                ⚠️ These figures are preliminary estimates. Final amounts are confirmed monthly by Wikala's accounting team and reflected in your monthly statement.
              </p>
            </>
          )}
        </div>
      )}

      {/* Tab: Monthly Statements */}
      {activeTab === 'statements' && (
        <div>
          {statements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-16 text-center">
              <p className="text-4xl mb-4">🧾</p>
              <p className="text-lg font-semibold text-[#1B2A4A] mb-2">No statements yet</p>
              <p className="text-sm text-[#6B6560]">
                Monthly statements are issued by Wikala's accounting team at the end of each month.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                    <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Period</th>
                    <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Total Sales</th>
                    <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Net Amount</th>
                    <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">Date</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {statements.map(stmt => (
                    <tr key={stmt.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4">
                        <p className="text-[#1B2A4A] font-medium">
                          {new Date(stmt.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[#6B6560]">
                          {new Date(stmt.period_start).toLocaleDateString('en-GB')} — {new Date(stmt.period_end).toLocaleDateString('en-GB')}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1B2A4A]">€{stmt.total_sales}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">€{stmt.net_amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                          ${stmt.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                            stmt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-100 text-gray-600'}`}>
                          {stmt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B6560]">
                        {new Date(stmt.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-[#C8952E] hover:underline">
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}