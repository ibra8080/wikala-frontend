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
  approved_at: string | null
  variants: { id: number; sku: string | null }[]
}

interface InventoryItem {
  id: number
  variant_sku: string
  quantity_in_germany: number
  quantity_sold: number
  quantity_available: number
  arrived_germany_at: string | null
}

interface LineItem {
  id: number
  item_type: string
  description: string
  amount: string
  discount: string
}

interface Dispute {
  id: number
  seller_message: string
  admin_response: string
  status: string
  created_at: string
}

interface FullStatement {
  id: number
  period_start: string
  period_end: string
  total_sales: string
  total_fees: string
  overall_discount: string
  discount_description: string
  net_amount: string
  status: string
  sent_at: string | null
  auto_finalize_date: string | null
  paid_at: string | null
  created_at: string
  admin_notes: string
  line_items: LineItem[]
  disputes: Dispute[]
  has_dispute: boolean
  seller_business_name: string
  seller_legal_name: string
  seller_full_name: string
  seller_email: string
  seller_phone: string
  seller_legal_address: string
  seller_city: string
  seller_country: string
  seller_tax_id: string
  seller_commercial_register: string
  seller_id_code: string
}

interface WebService {
  id: number
  name: string
  description: string
  type: string
  level: string
  price: string
  mandatory: boolean
}

interface WebServiceCharge {
  id: number
  service: number
  service_name: string
  service_level: string
  product: number | null
  product_name: string | null
  original_price: string
  discount_amount: string
  final_price: string
  status: string
  period_month: number | null
  period_year: number | null
  created_at: string
}

interface SellerDiscountCode {
  id: number
  code: {
    code: string
    name: string
    discount_type: string
    value: string
    applies_to: string
    service_name: string | null
  }
  applied_at: string
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
  listing_cost: number
  web_services_cost: number
  profit: number
}

export default function StatementsPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [statements, setStatements] = useState<FullStatement[]>([])
  const [charges, setCharges] = useState<WebServiceCharge[]>([])
  const [myCodes, setMyCodes] = useState<SellerDiscountCode[]>([])
  const [availableServices, setAvailableServices] = useState<WebService[]>([])
  const [requestingService, setRequestingService] = useState<number | null>(null)
  const [serviceMessage, setServiceMessage] = useState<{ id: number; type: 'success' | 'error'; text: string } | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeMessage, setCodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'statements' | 'services'>('overview')
  const [expandedStmt, setExpandedStmt] = useState<number | null>(null)
  const [disputingStmt, setDisputingStmt] = useState<number | null>(null)
  const [disputeMsg, setDisputeMsg] = useState('')
  const [disputeItemId, setDisputeItemId] = useState<string>('')
  const [stmtAction, setStmtAction] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [prodRes, invRes, stmtRes, chargesRes, codesRes, svcRes] = await Promise.all([
        api.get('/products/'),
        api.get('/inventory/'),
        api.get('/finance/statements/'),
        api.get('/finance/charges/'),
        api.get('/finance/codes/'),
        api.get('/finance/services/'),
      ])
      setProducts(prodRes.data)
      setInventory(invRes.data)
      setStatements(stmtRes.data.filter(
        (s: { status: string }) => ['sent', 'accepted', 'disputed', 'paid'].includes(s.status)
      ))
      setCharges(chargesRes.data)
      setMyCodes(codesRes.data)
      setAvailableServices(svcRes.data.filter((s: WebService) => !s.mandatory))
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRequestService = async (serviceId: number) => {
    setRequestingService(serviceId)
    setServiceMessage(null)
    try {
      await api.post(`/finance/services/${serviceId}/activate/`)
      setServiceMessage({ id: serviceId, type: 'success', text: 'Service activated successfully!' })
      await fetchAll()
    } catch {
      setServiceMessage({ id: serviceId, type: 'error', text: 'Failed to activate service.' })
    } finally {
      setRequestingService(null)
    }
  }

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return
    setCodeLoading(true)
    setCodeMessage(null)
    try {
      await api.post('/finance/codes/apply/', { code: codeInput.trim().toUpperCase() })
      setCodeMessage({ type: 'success', text: 'Code applied successfully!' })
      setCodeInput('')
      await fetchAll()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setCodeMessage({ type: 'error', text: error.response?.data?.error ?? 'Invalid code' })
    } finally {
      setCodeLoading(false)
    }
  }

  const handleAccept = async (stmtId: number) => {
    setStmtAction(stmtId)
    try {
      await api.post(`/finance/statements/${stmtId}/accept/`)
      await fetchAll()
    } finally { setStmtAction(null) }
  }

  const handleDispute = async (stmtId: number) => {
    if (!disputeMsg.trim()) return
    setStmtAction(stmtId)
    try {
      await api.post(`/finance/statements/${stmtId}/dispute/`, {
        seller_message: disputeMsg,
        line_item_id: disputeItemId || undefined,
      })
      setDisputingStmt(null)
      setDisputeMsg('')
      setDisputeItemId('')
      await fetchAll()
    } finally { setStmtAction(null) }
  }

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    void fetchAll()
  }, [user, _hasHydrated, router, fetchAll])

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
  const calcListingCost = (product: Product, skuIndex: number): number => {
    if (!product.approved_at) return 0
    const approvedAt = new Date(product.approved_at)
    const now = new Date()
    const days = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24)
    const months = Math.max(0, Math.floor(days / 30) - 1)
    if (months === 0) return 0
    if (skuIndex === 0) return 2 * months
    if (skuIndex <= 4) return 0
    return 0.5 * months
  }

  const buildRows = (): SkuRow[] => {
    const rows: SkuRow[] = []

    for (const inv of inventory) {
      const product = products.find(p =>
        p.product_code && inv.variant_sku?.startsWith(p.product_code)
      )
      if (!product) continue

      const sortedVariants = [...product.variants].sort((a, b) => a.id - b.id)
      const skuIndex = sortedVariants.findIndex(v => v.sku === inv.variant_sku)
      const listingCost = calcListingCost(product, skuIndex)

      const productCharges = charges.filter(c =>
        c.service_level === 'product' &&
        c.product_name === product.name_en
      )
      const webServicesCost = productCharges.reduce(
        (sum, c) => sum + parseFloat(c.final_price), 0
      )

      const price = parseFloat(product.price)
      const productionCost = parseFloat(product.production_cost ?? '0') || 0
      const storageCost = calcStorageCost(product, inv)
      const wikalaFee = (price * 0.15) + 1
      const vat = price * 0.19
      const totalCosts = productionCost + storageCost + wikalaFee + vat + listingCost + webServicesCost
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
        listing_cost: listingCost,
        web_services_cost: webServicesCost,
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
        <button onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${activeTab === 'services' ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
          Web Services
          {charges.filter(c => c.status === 'pending').length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C8952E] text-white text-[10px] font-bold">
              {charges.filter(c => c.status === 'pending').length}
            </span>
          )}
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
              <div className="bg-white rounded-2xl border border-[#E0DDDA] mb-4 overflow-x-auto">
                <table className="text-sm" style={{ minWidth: '1100px' }}>
                  <thead>
                    <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                      {[
                        'Product', 'SKU', 'Units Available', 'Units Sold',
                        'Production Cost', 'Storage Cost', 'Listing Fee',
                        'Web Services', 'Wikala Fee (15%+1)',
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
                        <td className="px-4 py-3 text-[#6B6560]">{fmt(row.listing_cost)}</td>
                        <td className="px-4 py-3 text-[#6B6560]">{fmt(row.web_services_cost)}</td>
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
                ⚠️ These figures are preliminary estimates. Final amounts are confirmed monthly by Wikala&apos;s accounting team and reflected in your monthly statement.
              </p>
            </>
          )}
        </div>
      )}

      {/* Tab: Monthly Statements */}
      {activeTab === 'statements' && (
        <div className="space-y-4">
          {statements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-16 text-center">
              <p className="text-4xl mb-4">🧾</p>
              <p className="text-lg font-semibold text-[#1B2A4A] mb-2">No statements yet</p>
              <p className="text-sm text-[#6B6560]">Monthly statements are issued by Wikala at the end of each month.</p>
            </div>
          ) : statements.map(stmt => (
            <div key={stmt.id} className={`bg-white rounded-2xl border overflow-hidden ${stmt.has_dispute ? 'border-red-300' : 'border-[#E0DDDA]'}`}>
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1B2A4A]">
                    {new Date(stmt.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-[#6B6560]">
                    {new Date(stmt.period_start).toLocaleDateString('en-GB')} — {new Date(stmt.period_end).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                    ${stmt.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                      stmt.status === 'accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      stmt.status === 'disputed' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {stmt.status}
                  </span>
                  <p className={`font-bold ${parseFloat(stmt.net_amount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(parseFloat(stmt.net_amount))}</p>
                  {stmt.status === 'sent' && (
                    <>
                      <button onClick={() => handleAccept(stmt.id)} disabled={stmtAction === stmt.id}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                        Accept
                      </button>
                      <button onClick={() => setDisputingStmt(stmt.id)}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100">
                        Dispute
                      </button>
                    </>
                  )}
                  <button onClick={() => setExpandedStmt(expandedStmt === stmt.id ? null : stmt.id)}
                    className="text-sm text-[#C8952E] hover:underline">
                    {expandedStmt === stmt.id ? 'Hide ↑' : 'View ↓'}
                  </button>
                </div>
              </div>

              {/* Dispute Form */}
              {disputingStmt === stmt.id && (
                <div className="px-6 pb-4 border-t border-[#E0DDDA] pt-4 bg-red-50">
                  <p className="text-sm font-medium text-red-700 mb-2">Submit Dispute</p>
                  <select value={disputeItemId} onChange={e => setDisputeItemId(e.target.value)}
                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none">
                    <option value="">Dispute entire statement</option>
                    {stmt.line_items.map(item => (
                      <option key={item.id} value={item.id}>{item.description} — €{item.amount}</option>
                    ))}
                  </select>
                  <textarea value={disputeMsg} onChange={e => setDisputeMsg(e.target.value)}
                    placeholder="Explain your dispute..." rows={3}
                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none mb-2" />
                  <div className="flex gap-2">
                    <button onClick={() => handleDispute(stmt.id)} disabled={!disputeMsg.trim() || stmtAction === stmt.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50">
                      Submit Dispute
                    </button>
                    <button onClick={() => setDisputingStmt(null)} className="text-xs text-[#6B6560] px-3 py-2">Cancel</button>
                  </div>
                </div>
              )}

              {/* Expanded */}
              {expandedStmt === stmt.id && (
                <div className="border-t border-[#E0DDDA]">
                  {/* Seller Legal Info */}
                  <div className="px-6 py-4 border-b border-[#E0DDDA]">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Invoice Details</p>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
                      <div><span className="text-xs text-[#6B6560]">Legal Name: </span><span className="text-[#1B2A4A]">{stmt.seller_legal_name}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Business Name: </span><span className="text-[#1B2A4A]">{stmt.seller_business_name}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Full Name: </span><span className="text-[#1B2A4A]">{stmt.seller_full_name}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Address: </span><span className="text-[#1B2A4A]">{stmt.seller_legal_address}</span></div>
                      <div><span className="text-xs text-[#6B6560]">City: </span><span className="text-[#1B2A4A]">{stmt.seller_city}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Country: </span><span className="text-[#1B2A4A]">{stmt.seller_country}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Email: </span><span className="text-[#1B2A4A]">{stmt.seller_email}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Phone: </span><span className="text-[#1B2A4A]">{stmt.seller_phone}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Seller ID: </span><span className="text-[#1B2A4A]">{stmt.seller_id_code}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Tax ID: </span><span className="text-[#1B2A4A]">{stmt.seller_tax_id}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Commercial Register: </span><span className="text-[#1B2A4A]">{stmt.seller_commercial_register}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Statement #: </span><span className="text-[#1B2A4A]">{stmt.id}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Period: </span><span className="text-[#1B2A4A]">{new Date(stmt.period_start).toLocaleDateString('en-GB')} — {new Date(stmt.period_end).toLocaleDateString('en-GB')}</span></div>
                      <div><span className="text-xs text-[#6B6560]">Issue Date: </span><span className="text-[#1B2A4A]">{new Date(stmt.created_at).toLocaleDateString('en-GB')}</span></div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="px-6 py-4 bg-[#F5F4F0] grid grid-cols-4 gap-4">
                    <div><p className="text-xs text-[#6B6560]">Total Sales</p><p className="font-semibold text-[#1B2A4A]">€{stmt.total_sales}</p></div>
                    <div><p className="text-xs text-[#6B6560]">Total Fees</p><p className="font-semibold text-[#1B2A4A]">€{stmt.total_fees}</p></div>
                    <div>
                      <p className="text-xs text-[#6B6560]">Discount</p>
                      <p className="font-semibold text-green-600">-€{stmt.overall_discount}</p>
                      {stmt.discount_description && <p className="text-xs text-[#6B6560] italic">{stmt.discount_description}</p>}
                    </div>
                    <div><p className="text-xs text-[#6B6560]">Net Amount</p><p className={`font-bold text-lg ${parseFloat(stmt.net_amount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>€{stmt.net_amount}</p></div>
                  </div>

                  {/* Line Items */}
                  <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Statement Details</p>
                    {stmt.line_items.length === 0 ? (
                      <p className="text-sm text-[#6B6560]">No line items.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E0DDDA]">
                            <th className="text-left text-xs text-[#6B6560] pb-2">Type</th>
                            <th className="text-left text-xs text-[#6B6560] pb-2">Description</th>
                            <th className="text-right text-xs text-[#6B6560] pb-2">Amount</th>
                            <th className="text-right text-xs text-[#6B6560] pb-2">Discount</th>
                            <th className="text-right text-xs text-[#6B6560] pb-2">Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stmt.line_items.map(item => (
                            <tr key={item.id} className="border-b border-[#E0DDDA] last:border-0">
                              <td className="py-2">
                                <span className="text-xs bg-[#F5F4F0] text-[#6B6560] px-2 py-0.5 rounded">{item.item_type}</span>
                              </td>
                              <td className="py-2 text-[#1B2A4A]">{item.description}</td>
                              <td className="py-2 text-right text-[#1B2A4A]">€{item.amount}</td>
                              <td className="py-2 text-right text-green-600">{parseFloat(item.discount) > 0 ? `-€${item.discount}` : '—'}</td>
                              <td className="py-2 text-right font-semibold text-[#1B2A4A]">
                                €{(parseFloat(item.amount) - parseFloat(item.discount)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Admin Notes */}
                  {stmt.admin_notes && (
                    <div className="px-6 py-4 border-t border-[#E0DDDA] bg-[#FAFAF8]">
                      <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-2">
                        Note from Wikala
                      </p>
                      <p className="text-sm text-[#1B2A4A]">{stmt.admin_notes}</p>
                    </div>
                  )}

                  {/* Disputes */}
                  {stmt.disputes.length > 0 && (
                    <div className="px-6 py-4 border-t border-[#E0DDDA]">
                      {stmt.disputes.map(d => (
                        <div key={d.id} className="bg-red-50 rounded-xl p-4 mb-2">
                          <p className="text-xs text-red-500 mb-1">{new Date(d.created_at).toLocaleDateString('en-GB')} · {d.status}</p>
                          <p className="text-sm text-red-800 mb-1"><span className="font-medium">Your dispute:</span> {d.seller_message}</p>
                          {d.admin_response && (
                            <p className="text-sm text-[#1B2A4A]"><span className="font-medium">Wikala response:</span> {d.admin_response}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-finalize notice */}
                  {stmt.auto_finalize_date && stmt.status === 'sent' && (
                    <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                      <p className="text-xs text-amber-700">
                        ⚠️ This statement will be automatically finalized on {new Date(stmt.auto_finalize_date).toLocaleDateString('en-GB')} if no dispute is raised.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Web Services */}
      {activeTab === 'services' && (
        <div className="space-y-6">

          {/* Apply Code */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
            <h2 className="font-semibold text-[#1B2A4A] mb-1">Discount Code</h2>
            <p className="text-xs text-[#6B6560] mb-4">Enter a discount code to apply it to your account.</p>
            <div className="flex gap-3">
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyCode()}
                placeholder="Enter code..."
                className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1B2A4A] transition"
              />
              <button
                onClick={handleApplyCode}
                disabled={codeLoading || !codeInput.trim()}
                className="bg-[#C8952E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                {codeLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {codeMessage && (
              <p className={`text-xs mt-2 font-medium ${codeMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {codeMessage.type === 'success' ? '✓' : '✗'} {codeMessage.text}
              </p>
            )}

            {/* Active Codes */}
            {myCodes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E0DDDA]">
                <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Applied Codes</p>
                <div className="space-y-2">
                  {myCodes.map(usage => (
                    <div key={usage.id} className="flex items-center justify-between bg-[#F5F4F0] rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-[#1B2A4A] text-sm">{usage.code.code}</span>
                        <span className="text-xs text-[#6B6560]">{usage.code.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-green-600">
                          {usage.code.discount_type === 'percent'
                            ? `${usage.code.value}% off`
                            : `€${usage.code?.value ? parseFloat(usage.code.value).toFixed(2) : '0.00'} off`}
                        </span>
                        <span className="text-xs text-[#6B6560]">
                          {usage.code.applies_to === 'all'
                            ? 'All services'
                            : usage.code.service_name ?? 'Specific service'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Available Optional Services */}
          {availableServices.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E0DDDA] bg-[#F5F4F0]">
                <p className="text-sm font-semibold text-[#1B2A4A]">Available Services</p>
                <p className="text-xs text-[#6B6560] mt-0.5">Optional services you can activate for your account</p>
              </div>
              <div className="divide-y divide-[#E0DDDA]">
                {availableServices.map(svc => {
                  const alreadyActive = charges.some(c => c.service === svc.id)
                  return (
                    <div key={svc.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-[#1B2A4A]">{svc.name}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border
                            ${svc.type === 'one_time' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              svc.type === 'monthly'  ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {svc.type.replace('_', ' ')}
                          </span>
                        </div>
                        {svc.description && (
                          <p className="text-xs text-[#6B6560]">{svc.description}</p>
                        )}
                        {serviceMessage?.id === svc.id && (
                          <p className={`text-xs mt-1 font-medium ${serviceMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {serviceMessage.type === 'success' ? '✓' : '✗'} {serviceMessage.text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <p className="font-semibold text-[#1B2A4A]">€{parseFloat(svc.price).toFixed(2)}</p>
                        {alreadyActive ? (
                          <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            ✓ Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestService(svc.id)}
                            disabled={requestingService === svc.id}
                            className="bg-[#C8952E] text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                            {requestingService === svc.id ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seller-level charges */}
          {charges.filter(c => c.service_level === 'seller').length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E0DDDA] bg-[#F5F4F0] flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1B2A4A]">Seller Service Charges</p>
                <span className="text-xs text-[#6B6560]">Charges applied to your account</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0DDDA]">
                    {['Service', 'Original', 'Discount', 'Final', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charges.filter(c => c.service_level === 'seller').map(charge => (
                    <tr key={charge.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4 font-medium text-[#1B2A4A]">{charge.service_name}</td>
                      <td className="px-6 py-4 text-[#6B6560]">€{charge.original_price}</td>
                      <td className="px-6 py-4 text-green-600">
                        {parseFloat(charge.discount_amount) > 0 ? `-€${charge.discount_amount}` : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1B2A4A]">€{charge.final_price}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                          ${charge.status === 'paid'   ? 'bg-green-50 text-green-700 border-green-200' :
                            charge.status === 'waived' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {charge.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B6560]">
                        {new Date(charge.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Product-level charges */}
          {charges.filter(c => c.service_level === 'product').length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E0DDDA] bg-[#F5F4F0] flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1B2A4A]">Product Service Charges</p>
                <span className="text-xs text-[#6B6560]">Charges applied per product</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0DDDA]">
                    {['Service', 'Product', 'Original', 'Discount', 'Final', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charges.filter(c => c.service_level === 'product').map(charge => (
                    <tr key={charge.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4 font-medium text-[#1B2A4A]">{charge.service_name}</td>
                      <td className="px-6 py-4 text-[#6B6560]">{charge.product_name ?? '—'}</td>
                      <td className="px-6 py-4 text-[#6B6560]">€{charge.original_price}</td>
                      <td className="px-6 py-4 text-green-600">
                        {parseFloat(charge.discount_amount) > 0 ? `-€${charge.discount_amount}` : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1B2A4A]">€{charge.final_price}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                          ${charge.status === 'paid'   ? 'bg-green-50 text-green-700 border-green-200' :
                            charge.status === 'waived' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {charge.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B6560]">
                        {new Date(charge.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {charges.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-12 text-center">
              <p className="text-sm text-[#6B6560]">No charges yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}