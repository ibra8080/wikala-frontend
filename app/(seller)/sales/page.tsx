'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface Agg { orders: number; units: number; revenue: number }
interface MonthPoint { month: string; orders: number; revenue: number }
interface DayPoint {
  day: string; day_num: number; orders: number; revenue: number
  is_weekend: boolean; is_future: boolean
}

interface Stats {
  today: Agg; month: Agg; year: Agg; all_time: Agg
  monthly_chart: MonthPoint[]
  daily_chart: DayPoint[]
}

interface SaleRow {
  id: number
  shopify_order_id: string
  variant_sku: string
  product_name: string
  product_id: number
  channel: string
  quantity_sold: number
  unit_price: string
  total_amount: string
  sale_date: string
}

interface ProductOption { id: number; name_en: string }

const fmtEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0)

export default function SellerSalesPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [rows, setRows] = useState<SaleRow[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [product, setProduct] = useState('')
  const [search, setSearch] = useState('')

  const fetchList = useCallback(() => {
    setListLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    if (product) params.append('product', product)
    if (search) params.append('search', search)
    api.get(`/finance/sales/list/?${params.toString()}`)
      .then(res => setRows(res.data))
      .finally(() => setListLoading(false))
  }, [dateFrom, dateTo, product, search])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'seller') { router.push('/admin/dashboard'); return }

    Promise.all([
      api.get('/finance/sales/stats/'),
      api.get('/finance/sales/list/'),
      api.get('/products/'),
    ]).then(([statsRes, listRes, productsRes]) => {
      setStats(statsRes.data)
      setRows(listRes.data)
      setProducts(productsRes.data)
    }).finally(() => setLoading(false))
  }, [user, _hasHydrated, router])

  const resetFilters = () => {
    setDateFrom(''); setDateTo(''); setProduct(''); setSearch('')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const statCards = [
    { label: 'Today', agg: stats?.today },
    { label: 'This Month', agg: stats?.month },
    { label: 'This Year', agg: stats?.year },
    { label: 'All Time', agg: stats?.all_time },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">My Sales</h1>
        <p className="text-sm text-[#6B6560] mt-1">Your orders & revenue analytics</p>
      </div>

      {/* Stat cards */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {statCards.map(c => (
          <div key={c.label} className="flex-1 bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <p className="text-xs text-[#6B6560] uppercase tracking-wide mb-2">{c.label}</p>
            <p className="text-3xl font-bold font-display text-[#1B2A4A]">{fmtEur(c.agg?.revenue ?? 0)}</p>
            <p className="text-sm text-[#6B6560] mt-1">{c.agg?.orders ?? 0} orders · {c.agg?.units ?? 0} units</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h3 className="text-base font-bold text-[#1B2A4A] mb-4">Monthly Revenue ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats?.monthly_chart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDDA" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6560' }}
                tickFormatter={(m: string) => m.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6560' }} />
              <Tooltip formatter={(v) => fmtEur(Number(v))} />
              <Line type="monotone" dataKey="revenue" stroke="#C8952E" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h3 className="text-base font-bold text-[#1B2A4A] mb-4">Daily Orders (this month)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.daily_chart ?? []} barCategoryGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDDA" />
              <XAxis dataKey="day_num" tick={{ fontSize: 10, fill: '#6B6560' }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6560' }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(200,149,46,0.08)' }}
                formatter={(v) => [Number(v), 'orders']}
                labelFormatter={(d) => `Day ${d}`}
              />
              <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
                {(stats?.daily_chart ?? []).map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.is_future ? '#EEECEA'
                      : entry.is_weekend ? '#C8952E'
                      : '#1B2A4A'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-5 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-[#6B6560] block mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#6B6560] block mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#6B6560] block mb-1">Product</label>
            <select value={product} onChange={e => setProduct(e.target.value)}
              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm">
              <option value="">All</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#6B6560] block mb-1">Search</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="SKU / order / product"
              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchList}
              className="flex-1 bg-[#1B2A4A] text-white rounded-lg px-3 py-2 text-sm hover:bg-[#243a63] transition">
              Apply
            </button>
            <button onClick={resetFilters}
              className="border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm hover:bg-[#F5F4F0] transition">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F4F0] text-[#6B6560]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Order</th>
                <th className="text-left px-4 py-3 font-semibold">Product</th>
                <th className="text-left px-4 py-3 font-semibold">SKU</th>
                <th className="text-right px-4 py-3 font-semibold">Qty</th>
                <th className="text-right px-4 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-[#6B6560]">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[#6B6560]">No sales found</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-t border-[#E0DDDA] hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3 text-[#1B2A4A]">{r.sale_date}</td>
                  <td className="px-4 py-3 text-[#6B6560] font-mono text-xs">{r.shopify_order_id || '—'}</td>
                  <td className="px-4 py-3 text-[#1B2A4A]">{r.product_name}</td>
                  <td className="px-4 py-3 text-[#6B6560] font-mono text-xs">{r.variant_sku}</td>
                  <td className="px-4 py-3 text-right text-[#1B2A4A]">{r.quantity_sold}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1B2A4A]">{fmtEur(parseFloat(r.total_amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}