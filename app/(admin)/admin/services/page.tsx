// app/(admin)/admin/services/page.tsx
'use client'

import { useCallback, useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

// ── Types ──────────────────────────────────────────────────────────────────

interface WebService {
  id: number
  name: string
  description: string
  type: string
  level: string
  price: string
  mandatory: boolean
  is_active: boolean
  created_at: string
}

interface DiscountCode {
  id: number
  code: string
  name: string
  discount_type: string
  value: string
  applies_to: string
  service: number | null
  service_name: string | null
  valid_from: string
  valid_until: string | null
  max_uses: number | null
  used_count: number
  is_active: boolean
  is_valid: boolean
}

interface SellerDiscount {
  id: number
  seller: number
  seller_name: string
  service: number | null
  service_name: string | null
  discount_type: string
  value: string
  valid_until: string | null
  is_active: boolean
  note: string
}

interface WebServiceCharge {
  id: number
  seller: number
  seller_name: string
  service: number
  service_name: string
  original_price: string
  discount_amount: string
  final_price: string
  status: string
  period_month: number | null
  period_year: number | null
  notes: string
  created_at: string
}

interface Seller {
  id: number
  business_name: string
}

// ── Style maps ─────────────────────────────────────────────────────────────

const typeStyles: Record<string, string> = {
  one_time: 'bg-purple-50 text-purple-700 border-purple-200',
  monthly:  'bg-blue-50 text-blue-700 border-blue-200',
  event:    'bg-amber-50 text-amber-700 border-amber-200',
}

const chargeStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid:    'bg-green-50 text-green-700 border-green-200',
  waived:  'bg-gray-100 text-gray-600 border-gray-200',
}

const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'services' | 'codes' | 'discounts' | 'charges'>('services')
  const [services, setServices]   = useState<WebService[]>([])
  const [codes, setCodes]         = useState<DiscountCode[]>([])
  const [discounts, setDiscounts] = useState<SellerDiscount[]>([])
  const [charges, setCharges]     = useState<WebServiceCharge[]>([])
  const [sellers, setSellers]     = useState<Seller[]>([])
  const [loading, setLoading]     = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Forms
  const [showNewService, setShowNewService]   = useState(false)
  const [showNewCode, setShowNewCode]         = useState(false)
  const [showNewDiscount, setShowNewDiscount] = useState(false)

  const [newService, setNewService] = useState({
    name: '', description: '', type: 'one_time',
    level: 'seller',
    price: '', mandatory: false, is_active: true,
  })

  const [newCode, setNewCode] = useState({
    code: '', name: '', discount_type: 'percent', value: '',
    applies_to: 'all', service: '', valid_from: '',
    valid_until: '', max_uses: '', is_active: true,
  })

  const [newDiscount, setNewDiscount] = useState({
    seller: '', service: '', discount_type: 'percent',
    value: '', valid_until: '', is_active: true, note: '',
  })

  // ── Editing states ──
  const [editingService, setEditingService] = useState<number | null>(null)
  const [editServiceForm, setEditServiceForm] = useState({ name: '', description: '', price: '', mandatory: false })
  const [editingCode, setEditingCode] = useState<number | null>(null)
  const [editCodeForm, setEditCodeForm] = useState({ name: '', value: '', valid_until: '' })
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null)
  const [editDiscountForm, setEditDiscountForm] = useState({ value: '', valid_until: '', note: '' })

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [svcRes, codeRes, discRes, chargeRes, sellerRes] = await Promise.all([
        api.get('/finance/admin/services/'),
        api.get('/finance/admin/codes/'),
        api.get('/finance/admin/discounts/'),
        api.get('/finance/admin/charges/'),
        api.get('/sellers/admin/list/'),
      ])
      setServices(svcRes.data)
      setCodes(codeRes.data)
      setDiscounts(discRes.data)
      setCharges(chargeRes.data)
      setSellers(sellerRes.data.filter((s: { status: string }) => s.status === 'approved'))
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

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleToggleService = async (id: number, is_active: boolean) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/services/${id}/`, { is_active: !is_active })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleCode = async (id: number, is_active: boolean) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/codes/${id}/`, { is_active: !is_active })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleDiscount = async (id: number, is_active: boolean) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/discounts/${id}/`, { is_active: !is_active })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const startEditService = (svc: WebService) => {
    setEditingService(svc.id)
    setEditServiceForm({ name: svc.name, description: svc.description, price: svc.price, mandatory: svc.mandatory })
  }
  const handleSaveService = async (id: number) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/services/${id}/`, editServiceForm)
      setEditingService(null)
      await fetchAll()
    } catch {
      window.alert('⚠️ Cannot edit — this service has existing charges.')
    } finally { setActionLoading(null) }
  }
  const startEditCode = (code: DiscountCode) => {
    setEditingCode(code.id)
    setEditCodeForm({ name: code.name, value: code.value, valid_until: code.valid_until || '' })
  }
  const handleSaveCode = async (id: number) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/codes/${id}/`, editCodeForm)
      setEditingCode(null)
      await fetchAll()
    } catch {
      window.alert('⚠️ Cannot edit — this code has already been used.')
    } finally { setActionLoading(null) }
  }
  const startEditDiscount = (disc: SellerDiscount) => {
    setEditingDiscount(disc.id)
    setEditDiscountForm({ value: disc.value, valid_until: disc.valid_until || '', note: disc.note })
  }
  const handleSaveDiscount = async (id: number) => {
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/discounts/${id}/`, editDiscountForm)
      setEditingDiscount(null)
      await fetchAll()
    } catch {
      window.alert('⚠️ Cannot edit — this discount is linked to existing charges.')
    } finally { setActionLoading(null) }
  }

  const handleChargeStatusChange = async (id: number, status: string) => {
    const message = status === 'paid'
      ? 'Mark this charge as paid? This confirms payment has been received.'
      : 'Waive this charge? The seller will no longer be required to pay this fee.'
    if (!window.confirm(message)) return
    setActionLoading(id)
    try {
      await api.patch(`/finance/admin/charges/${id}/`, { status })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateService = async () => {
    if (!newService.name || !newService.price) return
    setActionLoading(-1)
    try {
      await api.post('/finance/admin/services/', newService)
      setShowNewService(false)
      setNewService({ name: '', description: '', type: 'one_time', level: 'seller', price: '', mandatory: false, is_active: true })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateCode = async () => {
    if (!newCode.code || !newCode.value || !newCode.valid_from) return
    setActionLoading(-1)
    try {
      await api.post('/finance/admin/codes/', {
        ...newCode,
        service: newCode.service || null,
        max_uses: newCode.max_uses || null,
        valid_until: newCode.valid_until || null,
        code: newCode.code.toUpperCase(),
      })
      setShowNewCode(false)
      setNewCode({ code: '', name: '', discount_type: 'percent', value: '', applies_to: 'all', service: '', valid_from: '', valid_until: '', max_uses: '', is_active: true })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateDiscount = async () => {
    if (!newDiscount.seller || !newDiscount.value) return
    setActionLoading(-1)
    try {
      await api.post('/finance/admin/discounts/', {
        ...newDiscount,
        service: newDiscount.service || null,
        valid_until: newDiscount.valid_until || null,
      })
      setShowNewDiscount(false)
      setNewDiscount({ seller: '', service: '', discount_type: 'percent', value: '', valid_until: '', is_active: true, note: '' })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  const fmt = (n: string | number) => `€${parseFloat(String(n)).toFixed(2)}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tabs = [
    { key: 'services',  label: 'Services',          count: services.length },
    { key: 'codes',     label: 'Discount Codes',     count: codes.length },
    { key: 'discounts', label: 'Seller Discounts',   count: discounts.length },
    { key: 'charges',   label: 'Charges',            count: charges.length },
  ] as const

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Web Services</h1>
          <p className="text-sm text-[#6B6560] mt-1">Manage services, discount codes and seller charges</p>
        </div>
        {activeTab === 'services' && (
          <button onClick={() => setShowNewService(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
            + New Service
          </button>
        )}
        {activeTab === 'codes' && (
          <button onClick={() => setShowNewCode(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
            + New Code
          </button>
        )}
        {activeTab === 'discounts' && (
          <button onClick={() => setShowNewDiscount(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
            + New Discount
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab.key ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
            {tab.label}
            <span className="ml-2 text-xs opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ══ SERVICES ══ */}
      {activeTab === 'services' && (
        <div>
          {showNewService && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
              <p className="font-semibold text-[#1B2A4A] mb-4">New Service</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Name *</label>
                  <input value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Seller Registration" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Type *</label>
                  <select value={newService.type} onChange={e => setNewService(p => ({ ...p, type: e.target.value }))} className={inputClass}>
                    <option value="one_time">One Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Level *</label>
                  <select value={newService.level}
                    onChange={e => setNewService(p => ({ ...p, level: e.target.value }))}
                    className={inputClass}>
                    <option value="seller">Seller Level</option>
                    <option value="product">Product Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Price (€) *</label>
                  <input type="number" step="0.01" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} className={inputClass} placeholder="0.00" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[#6B6560] mb-1">Description</label>
                  <input value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Short description..." />
                </div>
                <div className="flex items-end gap-4 pb-0.5">
                  <label className="flex items-center gap-2 text-sm text-[#1B2A4A] cursor-pointer">
                    <input type="checkbox" checked={newService.mandatory} onChange={e => setNewService(p => ({ ...p, mandatory: e.target.checked }))} className="w-4 h-4" />
                    Mandatory
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#1B2A4A] cursor-pointer">
                    <input type="checkbox" checked={newService.is_active} onChange={e => setNewService(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4" />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateService} disabled={actionLoading === -1 || !newService.name || !newService.price}
                  className="bg-[#C8952E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                  Create Service
                </button>
                <button onClick={() => setShowNewService(false)} className="text-sm text-[#6B6560] px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                  {['Service', 'Type', 'Level', 'Price', 'Mandatory', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B6560]">No services yet.</td></tr>
                ) : services.map(svc => (
                  <Fragment key={svc.id}>
                    <tr className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#1B2A4A]">{svc.name}</p>
                        {svc.description && <p className="text-xs text-[#6B6560] mt-0.5">{svc.description}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${typeStyles[svc.type] ?? ''}`}>
                          {svc.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                          ${svc.level === 'seller'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {svc.level === 'seller' ? 'Seller' : 'Product'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1B2A4A]">{fmt(svc.price)}</td>
                      <td className="px-6 py-4">
                        {svc.mandatory
                          ? <span className="text-xs text-amber-700 font-medium">Mandatory</span>
                          : <span className="text-xs text-[#6B6560]">Optional</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                          ${svc.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {svc.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => startEditService(svc)}
                          className="text-xs text-[#1B2A4A] hover:underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleToggleService(svc.id, svc.is_active)}
                          disabled={actionLoading === svc.id}
                          className="text-xs text-[#C8952E] hover:underline disabled:opacity-50">
                          {svc.is_active ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {editingService === svc.id && (
                      <tr className="bg-blue-50 border-b border-[#E0DDDA]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex gap-3 items-end flex-wrap">
                            <div>
                              <label className="text-xs text-[#6B6560]">Name</label>
                              <input value={editServiceForm.name} onChange={e => setEditServiceForm(p => ({...p, name: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-48" />
                            </div>
                            <div>
                              <label className="text-xs text-[#6B6560]">Price (€)</label>
                              <input type="number" value={editServiceForm.price} onChange={e => setEditServiceForm(p => ({...p, price: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-24" />
                            </div>
                            <div>
                              <label className="text-xs text-[#6B6560]">Description</label>
                              <input value={editServiceForm.description} onChange={e => setEditServiceForm(p => ({...p, description: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-64" />
                            </div>
                            <label className="flex items-center gap-1 text-xs">
                              <input type="checkbox" checked={editServiceForm.mandatory} onChange={e => setEditServiceForm(p => ({...p, mandatory: e.target.checked}))} />
                              Mandatory
                            </label>
                            <button onClick={() => handleSaveService(svc.id)} disabled={actionLoading === svc.id}
                              className="bg-[#1B2A4A] text-white px-4 py-1.5 rounded text-xs disabled:opacity-50">Save</button>
                            <button onClick={() => setEditingService(null)} className="text-xs text-[#6B6560]">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ DISCOUNT CODES ══ */}
      {activeTab === 'codes' && (
        <div>
          {showNewCode && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
              <p className="font-semibold text-[#1B2A4A] mb-4">New Discount Code</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Code * (will be uppercased)</label>
                  <input value={newCode.code} onChange={e => setNewCode(p => ({ ...p, code: e.target.value }))} className={inputClass} placeholder="e.g. CAIRO2024" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Name *</label>
                  <input value={newCode.name} onChange={e => setNewCode(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Cairo Manufacturers" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Applies To</label>
                  <select value={newCode.applies_to} onChange={e => setNewCode(p => ({ ...p, applies_to: e.target.value, service: '' }))} className={inputClass}>
                    <option value="all">All Services</option>
                    <option value="specific">Specific Service</option>
                  </select>
                </div>
                {newCode.applies_to === 'specific' && (
                  <div>
                    <label className="block text-xs text-[#6B6560] mb-1">Service</label>
                    <select value={newCode.service} onChange={e => setNewCode(p => ({ ...p, service: e.target.value }))} className={inputClass}>
                      <option value="">Select service...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Discount Type</label>
                  <select value={newCode.discount_type} onChange={e => setNewCode(p => ({ ...p, discount_type: e.target.value }))} className={inputClass}>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Value *</label>
                  <input type="number" step="0.01" value={newCode.value} onChange={e => setNewCode(p => ({ ...p, value: e.target.value }))} className={inputClass} placeholder={newCode.discount_type === 'percent' ? '0-100' : '0.00'} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Valid From *</label>
                  <input type="date" value={newCode.valid_from} onChange={e => setNewCode(p => ({ ...p, valid_from: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Valid Until</label>
                  <input type="date" value={newCode.valid_until} onChange={e => setNewCode(p => ({ ...p, valid_until: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Max Uses (blank = unlimited)</label>
                  <input type="number" value={newCode.max_uses} onChange={e => setNewCode(p => ({ ...p, max_uses: e.target.value }))} className={inputClass} placeholder="Unlimited" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateCode} disabled={actionLoading === -1 || !newCode.code || !newCode.value || !newCode.valid_from}
                  className="bg-[#C8952E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                  Create Code
                </button>
                <button onClick={() => setShowNewCode(false)} className="text-sm text-[#6B6560] px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                  {['Code', 'Discount', 'Applies To', 'Validity', 'Usage', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6B6560]">No codes yet.</td></tr>
                ) : codes.map(code => (
                  <Fragment key={code.id}>
                    <tr className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                      <td className="px-6 py-4">
                        <p className="font-mono font-semibold text-[#1B2A4A]">{code.code}</p>
                        <p className="text-xs text-[#6B6560] mt-0.5">{code.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#1B2A4A]">
                          {code.discount_type === 'percent' ? `${code.value}%` : fmt(code.value)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#6B6560]">
                          {code.applies_to === 'all' ? 'All Services' : code.service_name ?? '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-[#6B6560]">
                          {new Date(code.valid_from).toLocaleDateString('en-GB')}
                          {code.valid_until && ` → ${new Date(code.valid_until).toLocaleDateString('en-GB')}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1B2A4A]">
                          {code.used_count}{code.max_uses ? `/${code.max_uses}` : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                          ${code.is_valid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {code.is_valid ? 'Valid' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => startEditCode(code)}
                          className="text-xs text-[#1B2A4A] hover:underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleToggleCode(code.id, code.is_active)}
                          disabled={actionLoading === code.id}
                          className="text-xs text-[#C8952E] hover:underline disabled:opacity-50">
                          {code.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                    {editingCode === code.id && (
                      <tr className="bg-blue-50 border-b border-[#E0DDDA]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex gap-3 items-end flex-wrap">
                            <div>
                              <label className="text-xs text-[#6B6560]">Name</label>
                              <input value={editCodeForm.name} onChange={e => setEditCodeForm(p => ({...p, name: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-48" />
                            </div>
                            <div>
                              <label className="text-xs text-[#6B6560]">Value</label>
                              <input type="number" value={editCodeForm.value} onChange={e => setEditCodeForm(p => ({...p, value: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-24" />
                            </div>
                            <div>
                              <label className="text-xs text-[#6B6560]">Valid Until</label>
                              <input type="date" value={editCodeForm.valid_until} onChange={e => setEditCodeForm(p => ({...p, valid_until: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm" />
                            </div>
                            <button onClick={() => handleSaveCode(code.id)} disabled={actionLoading === code.id}
                              className="bg-[#1B2A4A] text-white px-4 py-1.5 rounded text-xs disabled:opacity-50">Save</button>
                            <button onClick={() => setEditingCode(null)} className="text-xs text-[#6B6560]">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ SELLER DISCOUNTS ══ */}
      {activeTab === 'discounts' && (
        <div>
          {showNewDiscount && (
            <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
              <p className="font-semibold text-[#1B2A4A] mb-4">New Direct Discount</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Seller *</label>
                  <select value={newDiscount.seller} onChange={e => setNewDiscount(p => ({ ...p, seller: e.target.value }))} className={inputClass}>
                    <option value="">Select seller...</option>
                    {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Service (blank = all)</label>
                  <select value={newDiscount.service} onChange={e => setNewDiscount(p => ({ ...p, service: e.target.value }))} className={inputClass}>
                    <option value="">All Services</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Discount Type</label>
                  <select value={newDiscount.discount_type} onChange={e => setNewDiscount(p => ({ ...p, discount_type: e.target.value }))} className={inputClass}>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Value *</label>
                  <input type="number" step="0.01" value={newDiscount.value} onChange={e => setNewDiscount(p => ({ ...p, value: e.target.value }))} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Valid Until</label>
                  <input type="date" value={newDiscount.valid_until} onChange={e => setNewDiscount(p => ({ ...p, valid_until: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-[#6B6560] mb-1">Note</label>
                  <input value={newDiscount.note} onChange={e => setNewDiscount(p => ({ ...p, note: e.target.value }))} className={inputClass} placeholder="Reason for discount..." />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateDiscount} disabled={actionLoading === -1 || !newDiscount.seller || !newDiscount.value}
                  className="bg-[#C8952E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                  Create Discount
                </button>
                <button onClick={() => setShowNewDiscount(false)} className="text-sm text-[#6B6560] px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                  {['Seller', 'Service', 'Discount', 'Valid Until', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discounts.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B6560]">No discounts yet.</td></tr>
                ) : discounts.map(disc => (
                  <Fragment key={disc.id}>
                    <tr className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#1B2A4A]">{disc.seller_name}</p>
                        {disc.note && <p className="text-xs text-[#6B6560] mt-0.5">{disc.note}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B6560]">{disc.service_name ?? 'All Services'}</td>
                      <td className="px-6 py-4 font-semibold text-[#1B2A4A]">
                        {disc.discount_type === 'percent' ? `${disc.value}%` : fmt(disc.value)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B6560]">
                        {disc.valid_until ? new Date(disc.valid_until).toLocaleDateString('en-GB') : 'No expiry'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                          ${disc.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {disc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => startEditDiscount(disc)}
                          className="text-xs text-[#1B2A4A] hover:underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleToggleDiscount(disc.id, disc.is_active)}
                          disabled={actionLoading === disc.id}
                          className="text-xs text-[#C8952E] hover:underline disabled:opacity-50">
                          {disc.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                    {editingDiscount === disc.id && (
                      <tr className="bg-blue-50 border-b border-[#E0DDDA]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex gap-3 items-end flex-wrap">
                            <div>
                              <label className="text-xs text-[#6B6560]">Value</label>
                              <input type="number" value={editDiscountForm.value} onChange={e => setEditDiscountForm(p => ({...p, value: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-24" />
                            </div>
                            <div>
                              <label className="text-xs text-[#6B6560]">Valid Until</label>
                              <input type="date" value={editDiscountForm.valid_until} onChange={e => setEditDiscountForm(p => ({...p, valid_until: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-[#6B6560]">Note</label>
                              <input value={editDiscountForm.note} onChange={e => setEditDiscountForm(p => ({...p, note: e.target.value}))}
                                className="block border border-[#E0DDDA] rounded px-3 py-1.5 text-sm w-48" />
                            </div>
                            <button onClick={() => handleSaveDiscount(disc.id)} disabled={actionLoading === disc.id}
                              className="bg-[#1B2A4A] text-white px-4 py-1.5 rounded text-xs disabled:opacity-50">Save</button>
                            <button onClick={() => setEditingDiscount(null)} className="text-xs text-[#6B6560]">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ CHARGES ══ */}
      {activeTab === 'charges' && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
                {['Seller', 'Service', 'Original', 'Discount', 'Final', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {charges.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6B6560]">No charges yet.</td></tr>
              ) : charges.map(charge => (
                <tr key={charge.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8] transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1B2A4A]">{charge.seller_name}</p>
                    {charge.period_month && (
                      <p className="text-xs text-[#6B6560]">{charge.period_month}/{charge.period_year}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B6560]">{charge.service_name}</td>
                  <td className="px-6 py-4 text-sm text-[#1B2A4A]">{fmt(charge.original_price)}</td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {parseFloat(charge.discount_amount) > 0 ? `-${fmt(charge.discount_amount)}` : '—'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#1B2A4A]">{fmt(charge.final_price)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${chargeStatusStyles[charge.status] ?? ''}`}>
                      {charge.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {charge.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleChargeStatusChange(charge.id, 'paid')}
                          disabled={actionLoading === charge.id}
                          className="text-xs text-green-700 hover:underline disabled:opacity-50">
                          Mark Paid
                        </button>
                        <button onClick={() => handleChargeStatusChange(charge.id, 'waived')}
                          disabled={actionLoading === charge.id}
                          className="text-xs text-[#6B6560] hover:underline disabled:opacity-50">
                          Waive
                        </button>
                      </div>
                    )}
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