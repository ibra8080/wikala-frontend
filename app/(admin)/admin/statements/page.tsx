// app/(admin)/admin/statements/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface Seller {
  id: number
  business_name: string
  seller_id: string
  status: string
}

interface BreakdownRow {
  product_code: string
  product_name: string
  sku: string
  qty_germany: number
  months: number
  volume_m3: number
  storage_cost: number
}

interface ShippingDetail {
  product_code: string
  product_name: string
  actual_kg: number
  volumetric_kg: number
  chargeable_kg: number
  num_cartons: number
  shipping_cost: number
}

interface CalcResult {
  total_sales: number
  commission_amount: number
  storage_fee_amount: number
  pick_pack_amount: number
  shipping_fee_amount: number
  net_amount: number
  breakdown: BreakdownRow[]
  shipping_detail: ShippingDetail[]
}

interface SaleRecord {
  id: number
  product_name: string
  shopify_order_id: string
  channel: string
  quantity_sold: number
  unit_price: string
  total_amount: string
  sale_date: string
}

interface Statement {
  id: number
  seller: number
  seller_name: string
  period_start: string
  period_end: string
  total_sales: string
  commission_amount: string
  storage_fee_amount: string
  pick_pack_amount: string
  shipping_fee_amount: string
  net_amount: string
  status: string
  paid_at: string | null
  created_at: string
  sale_records: SaleRecord[]
}

const statusStyles: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-600 border-gray-200',
  sent:    'bg-amber-50 text-amber-700 border-amber-200',
  paid:    'bg-green-50 text-green-700 border-green-200',
}

const tabs = ['all', 'draft', 'sent', 'paid']

export default function AdminStatementsPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()

  const [statements, setStatements]     = useState<Statement[]>([])
  const [sellers, setSellers]           = useState<Seller[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')
  const [expandedId, setExpandedId]     = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // New Statement
  const [showNew, setShowNew]           = useState(false)
  const [calcResult, setCalcResult]     = useState<CalcResult | null>(null)
  const [calculating, setCalculating]   = useState(false)
  const [creating, setCreating]         = useState(false)
  const [calcError, setCalcError]       = useState('')

  const [form, setForm] = useState({
    seller: '',
    period_start: '',
    period_end: '',
    shipping_rate: '',
  })

  const fetchAll = useCallback(async () => {
    try {
      const [stmtRes, sellerRes] = await Promise.all([
        api.get('/finance/admin/statements/'),
        api.get('/sellers/admin/list/'),
      ])
      setStatements(stmtRes.data)
      setSellers(sellerRes.data.filter((s: Seller & { status: string }) => s.status === 'approved'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchAll()
  }, [user, _hasHydrated, router, fetchAll])

  // ── Calculate ──────────────────────────────────────────────────────────────

  const handleCalculate = async () => {
    if (!form.seller || !form.shipping_rate) return
    setCalculating(true)
    setCalcError('')
    setCalcResult(null)
    try {
      const res = await api.post('/finance/admin/statements/calculate/', {
        seller: parseInt(form.seller),
        period_start: form.period_start || '2020-01-01',
        period_end: form.period_end || new Date().toISOString().split('T')[0],
        shipping_rate: parseFloat(form.shipping_rate),
      })
      setCalcResult(res.data)
    } catch {
      setCalcError('Calculation failed. Please check inputs.')
    } finally {
      setCalculating(false)
    }
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!calcResult || !form.seller) return
    setCreating(true)
    try {
      await api.post('/finance/admin/statements/', {
        seller: parseInt(form.seller),
        period_start: form.period_start || '2020-01-01',
        period_end: form.period_end || new Date().toISOString().split('T')[0],
        total_sales: calcResult.total_sales,
        commission_amount: calcResult.commission_amount,
        storage_fee_amount: calcResult.storage_fee_amount,
        pick_pack_amount: calcResult.pick_pack_amount,
        shipping_fee_amount: calcResult.shipping_fee_amount,
        net_amount: calcResult.net_amount,
        status: 'draft',
      })
      setShowNew(false)
      setCalcResult(null)
      setForm({ seller: '', period_start: '', period_end: '', shipping_rate: '' })
      await fetchAll()
    } finally {
      setCreating(false)
    }
  }

  // ── Status Change ──────────────────────────────────────────────────────────

  const handleStatusChange = async (id: number, status: string) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/statements/${id}/`, { status })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filter === 'all' ? statements : statements.filter(s => s.status === filter)
  const fmt = (n: string | number) => `€${parseFloat(String(n)).toFixed(2)}`
  const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Statements</h1>
          <p className="text-sm text-[#6B6560] mt-1">{statements.length} total statements</p>
        </div>
        <button onClick={() => { setShowNew(true); setCalcResult(null) }}
          className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
          + New Statement
        </button>
      </div>

      {/* ══ New Statement Form ══ */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
          <p className="font-semibold text-[#1B2A4A] mb-4">New Statement</p>

          {/* Step 1: Inputs */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Seller <span className="text-red-400">*</span></label>
              <select value={form.seller} onChange={e => { setForm(p => ({ ...p, seller: e.target.value })); setCalcResult(null) }} className={inputClass}>
                <option value="">Select seller...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Period Start</label>
              <input type="date" value={form.period_start} onChange={e => { setForm(p => ({ ...p, period_start: e.target.value })); setCalcResult(null) }} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Period End</label>
              <input type="date" value={form.period_end} onChange={e => { setForm(p => ({ ...p, period_end: e.target.value })); setCalcResult(null) }} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">
                Shipping Rate (€/kg) <span className="text-red-400">*</span>
              </label>
              <input type="number" step="0.01" value={form.shipping_rate}
                onChange={e => { setForm(p => ({ ...p, shipping_rate: e.target.value })); setCalcResult(null) }}
                placeholder="e.g. 5.00" className={inputClass} />
            </div>
          </div>

          <button onClick={handleCalculate}
            disabled={calculating || !form.seller || !form.shipping_rate}
            className="bg-[#C8952E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition mb-4">
            {calculating ? 'Calculating...' : '⚡ Calculate'}
          </button>

          {calcError && <p className="text-red-500 text-sm mb-4">{calcError}</p>}

          {/* Step 2: Results */}
          {calcResult && (
            <div>
              {/* Summary */}
              <div className="grid grid-cols-6 gap-3 bg-[#F5F4F0] rounded-xl p-4 mb-4">
                {[
                  { label: 'Total Sales',    value: fmt(calcResult.total_sales) },
                  { label: 'Commission',     value: fmt(calcResult.commission_amount) },
                  { label: 'Storage Fee',    value: fmt(calcResult.storage_fee_amount) },
                  { label: 'Pick & Pack',    value: fmt(calcResult.pick_pack_amount) },
                  { label: 'Shipping',       value: fmt(calcResult.shipping_fee_amount) },
                  { label: 'Net Amount',     value: fmt(calcResult.net_amount), highlight: true },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#6B6560]">{item.label}</p>
                    <p className={`font-semibold mt-0.5 text-sm ${item.highlight ? 'text-green-600' : 'text-[#1B2A4A]'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Storage Breakdown */}
              {calcResult.breakdown.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-2">Storage Breakdown</p>
                  <table className="w-full text-sm border border-[#E0DDDA] rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-[#F5F4F0] border-b border-[#E0DDDA]">
                        {['Product', 'SKU', 'Qty', 'Months', 'Volume (m³)', 'Storage Cost'].map(h => (
                          <th key={h} className="text-left text-xs text-[#6B6560] px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calcResult.breakdown.map(row => (
                        <tr key={row.sku} className="border-b border-[#E0DDDA] last:border-0">
                          <td className="px-3 py-2 text-[#1B2A4A]">{row.product_name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-[#6B6560]">{row.sku}</td>
                          <td className="px-3 py-2 text-[#1B2A4A]">{row.qty_germany}</td>
                          <td className="px-3 py-2 text-[#6B6560]">{row.months}</td>
                          <td className="px-3 py-2 text-[#6B6560]">{row.volume_m3}</td>
                          <td className="px-3 py-2 font-semibold text-[#1B2A4A]">{fmt(row.storage_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Shipping Breakdown */}
              {calcResult.shipping_detail.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-2">Shipping Breakdown</p>
                  <table className="w-full text-sm border border-[#E0DDDA] rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-[#F5F4F0] border-b border-[#E0DDDA]">
                        {['Product', 'Actual (kg)', 'Volumetric (kg)', 'Chargeable (kg)', 'Cartons', 'Shipping Cost'].map(h => (
                          <th key={h} className="text-left text-xs text-[#6B6560] px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calcResult.shipping_detail.map(row => (
                        <tr key={row.product_code} className="border-b border-[#E0DDDA] last:border-0">
                          <td className="px-3 py-2 text-[#1B2A4A]">{row.product_name}</td>
                          <td className="px-3 py-2 text-[#6B6560]">{row.actual_kg}</td>
                          <td className="px-3 py-2 text-[#6B6560]">{row.volumetric_kg}</td>
                          <td className="px-3 py-2 font-semibold text-[#C8952E]">{row.chargeable_kg}</td>
                          <td className="px-3 py-2 text-[#6B6560]">{row.num_cartons}</td>
                          <td className="px-3 py-2 font-semibold text-[#1B2A4A]">{fmt(row.shipping_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={creating}
                  className="bg-[#1B2A4A] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition">
                  {creating ? 'Creating...' : '✓ Create Statement'}
                </button>
                <button onClick={() => { setShowNew(false); setCalcResult(null) }}
                  className="text-sm text-[#6B6560] px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Filter Tabs ══ */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${filter === tab ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-2 text-xs opacity-70">
              {tab === 'all' ? statements.length : statements.filter(s => s.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* ══ Statements List ══ */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-12 text-center">
            <p className="text-sm text-[#6B6560]">No statements found.</p>
          </div>
        ) : filtered.map(stmt => (
          <div key={stmt.id} className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">

            {/* Row */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-[#1B2A4A]">{stmt.seller_name}</p>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    {new Date(stmt.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    {' · '}
                    {new Date(stmt.period_start).toLocaleDateString('en-GB')} — {new Date(stmt.period_end).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[stmt.status] ?? ''}`}>
                  {stmt.status}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-[#6B6560]">Total Sales</p>
                  <p className="font-semibold text-[#1B2A4A]">{fmt(stmt.total_sales)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B6560]">Net Amount</p>
                  <p className="font-semibold text-green-600">{fmt(stmt.net_amount)}</p>
                </div>

                {stmt.status === 'draft' && (
                  <button onClick={() => handleStatusChange(stmt.id, 'sent')}
                    disabled={actionLoading === stmt.id}
                    className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 disabled:opacity-50 transition">
                    Send to Seller
                  </button>
                )}
                {stmt.status === 'sent' && (
                  <button onClick={() => handleStatusChange(stmt.id, 'paid')}
                    disabled={actionLoading === stmt.id}
                    className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 transition">
                    Mark as Paid
                  </button>
                )}

                <button onClick={() => setExpandedId(expandedId === stmt.id ? null : stmt.id)}
                  className="text-sm text-[#C8952E] hover:underline">
                  {expandedId === stmt.id ? 'Hide ↑' : 'View ↓'}
                </button>
              </div>
            </div>

            {/* Expanded */}
            {expandedId === stmt.id && (
              <div className="border-t border-[#E0DDDA]">
                <div className="px-6 py-4 grid grid-cols-5 gap-4 bg-[#F5F4F0]">
                  {[
                    { label: 'Total Sales',    value: fmt(stmt.total_sales) },
                    { label: 'Commission',     value: fmt(stmt.commission_amount) },
                    { label: 'Storage Fee',    value: fmt(stmt.storage_fee_amount) },
                    { label: 'Shipping Fee',   value: fmt(stmt.shipping_fee_amount) },
                    { label: 'Net Amount',     value: fmt(stmt.net_amount), highlight: true },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-[#6B6560]">{item.label}</p>
                      <p className={`font-semibold mt-0.5 ${item.highlight ? 'text-green-600' : 'text-[#1B2A4A]'}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {stmt.sale_records?.length > 0 ? (
                  <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Sale Records</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E0DDDA]">
                          {['Product', 'Order ID', 'Channel', 'Qty', 'Unit Price', 'Total', 'Date'].map(h => (
                            <th key={h} className="text-left text-xs text-[#6B6560] pb-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stmt.sale_records.map(rec => (
                          <tr key={rec.id} className="border-b border-[#E0DDDA] last:border-0">
                            <td className="py-2 text-[#1B2A4A]">{rec.product_name}</td>
                            <td className="py-2 font-mono text-xs text-[#6B6560]">{rec.shopify_order_id || '—'}</td>
                            <td className="py-2 text-[#6B6560]">{rec.channel}</td>
                            <td className="py-2 text-[#1B2A4A]">{rec.quantity_sold}</td>
                            <td className="py-2 text-[#1B2A4A]">{fmt(rec.unit_price)}</td>
                            <td className="py-2 font-semibold text-[#1B2A4A]">{fmt(rec.total_amount)}</td>
                            <td className="py-2 text-[#6B6560]">{new Date(rec.sale_date).toLocaleDateString('en-GB')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-4">
                    <p className="text-sm text-[#6B6560]">No sale records attached yet.</p>
                  </div>
                )}

                {stmt.status === 'paid' && stmt.paid_at && (
                  <div className="px-6 py-3 bg-green-50 border-t border-green-100">
                    <p className="text-xs text-green-700">
                      Paid on {new Date(stmt.paid_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}