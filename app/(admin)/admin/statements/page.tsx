'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface Seller { id: number; business_name: string; seller_id: string; status: string }

interface LineItem {
  id: number
  item_type: string
  description: string
  quantity: string
  unit_price: string
  amount: string
  discount: string
  order_index: number
}

interface Dispute {
  id: number
  line_item: number | null
  seller_message: string
  admin_response: string
  status: string
  created_at: string
}

interface Statement {
  id: number
  seller: number
  seller_name: string
  period_start: string
  period_end: string
  total_sales: string
  total_fees: string
  overall_discount: string
  discount_description: string
  net_amount: string
  status: string
  admin_notes: string
  sent_at: string | null
  auto_finalize_date: string | null
  paid_at: string | null
  created_at: string
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

const statusStyles: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600 border-gray-200',
  sent:     'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
  paid:     'bg-green-50 text-green-700 border-green-200',
}

const fmt = (n: string | number) => `€${parseFloat(String(n)).toFixed(2)}`
const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

export default function AdminStatementsPage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [statements, setStatements] = useState<Statement[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Generate form
  const [showNew, setShowNew] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [form, setForm] = useState({ seller: '', period_start: '', period_end: '', shipping_rate: '0' })

  // Edit line item
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editItemForm, setEditItemForm] = useState({ description: '', amount: '', discount: '0' })

  // Add line item
  const [addingItemTo, setAddingItemTo] = useState<number | null>(null)
  const [newItem, setNewItem] = useState({ description: '', item_type: 'custom', amount: '', discount: '0' })

  // Overall discount
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null)
  const [discountValue, setDiscountValue] = useState('0')
  const [discountDesc, setDiscountDesc] = useState('')

  // Admin notes
  const [editingNotes, setEditingNotes] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')

  // Dispute resolve
  const [resolvingDispute, setResolvingDispute] = useState<{ stmtId: number; disputeId: number } | null>(null)
  const [disputeResponse, setDisputeResponse] = useState('')

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

  const handleGenerate = async () => {
    if (!form.seller || !form.period_start || !form.period_end) return
    setGenerating(true)
    setGenError('')
    try {
      await api.post('/finance/admin/statements/generate/', {
        seller: parseInt(form.seller),
        period_start: form.period_start,
        period_end: form.period_end,
        shipping_rate: parseFloat(form.shipping_rate || '0'),
      })
      setShowNew(false)
      setForm({ seller: '', period_start: '', period_end: '', shipping_rate: '0' })
      await fetchAll()
    } catch {
      setGenError('Failed to generate statement.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSend = async (id: number) => {
    setActionLoading(id)
    try {
      await api.post(`/finance/admin/statements/${id}/send/`)
      await fetchAll()
    } finally { setActionLoading(null) }
  }

  const handleMarkPaid = async (id: number) => {
    setActionLoading(id)
    try {
      await api.post(`/finance/admin/statements/${id}/mark-paid/`)
      await fetchAll()
    } finally { setActionLoading(null) }
  }

  const handleSaveItem = async (stmtId: number, itemId: number) => {
    try {
      await api.patch(`/finance/admin/statements/${stmtId}/line-items/${itemId}/`, editItemForm)
      setEditingItem(null)
      await fetchAll()
    } catch { alert('Failed to update item.') }
  }

  const handleDeleteItem = async (stmtId: number, itemId: number) => {
    if (!confirm('Delete this line item?')) return
    try {
      await api.delete(`/finance/admin/statements/${stmtId}/line-items/${itemId}/`)
      await fetchAll()
    } catch { alert('Failed to delete item.') }
  }

  const handleAddItem = async (stmtId: number) => {
    if (!newItem.description || !newItem.amount) return
    try {
      await api.post(`/finance/admin/statements/${stmtId}/line-items/`, {
        ...newItem, quantity: 1, unit_price: newItem.amount,
      })
      setAddingItemTo(null)
      setNewItem({ description: '', item_type: 'custom', amount: '', discount: '0' })
      await fetchAll()
    } catch { alert('Failed to add item.') }
  }

  const handleUpdateDiscount = async (stmtId: number) => {
    try {
      await api.patch(`/finance/admin/statements/${stmtId}/`, { overall_discount: discountValue, discount_description: discountDesc })
      setEditingDiscount(null)
      await fetchAll()
    } catch { alert('Failed to update discount.') }
  }

  const handleUpdateNotes = async (stmtId: number) => {
    try {
      await api.patch(`/finance/admin/statements/${stmtId}/`, { admin_notes: notesValue })
      setEditingNotes(null)
      await fetchAll()
    } catch { alert('Failed to update notes.') }
  }

  const handleResolveDispute = async (stmtId: number, disputeId: number, newStatus: string) => {
    try {
      await api.patch(`/finance/admin/statements/${stmtId}/disputes/${disputeId}/resolve/`, {
        admin_response: disputeResponse, status: newStatus,
      })
      setResolvingDispute(null)
      setDisputeResponse('')
      await fetchAll()
    } catch { alert('Failed to resolve dispute.') }
  }

  const tabs = ['all', 'draft', 'sent', 'disputed', 'accepted', 'paid']
  const filtered = filter === 'all' ? statements : statements.filter(s => s.status === filter)

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
        <button onClick={() => setShowNew(true)}
          className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
          + New Statement
        </button>
      </div>

      {/* Generate Form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
          <p className="font-semibold text-[#1B2A4A] mb-4">Generate New Statement</p>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Seller *</label>
              <select value={form.seller} onChange={e => setForm(p => ({ ...p, seller: e.target.value }))} className={inputClass}>
                <option value="">Select seller...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Period Start *</label>
              <input type="date" value={form.period_start} onChange={e => setForm(p => ({ ...p, period_start: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Period End *</label>
              <input type="date" value={form.period_end} onChange={e => setForm(p => ({ ...p, period_end: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Shipping Rate (€/kg)</label>
              <input type="number" step="0.01" value={form.shipping_rate} onChange={e => setForm(p => ({ ...p, shipping_rate: e.target.value }))} placeholder="0.00" className={inputClass} />
            </div>
          </div>
          {genError && <p className="text-red-500 text-sm mb-3">{genError}</p>}
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={generating || !form.seller || !form.period_start || !form.period_end}
              className="bg-[#C8952E] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
              {generating ? 'Generating...' : '⚡ Generate Statement'}
            </button>
            <button onClick={() => setShowNew(false)} className="text-sm text-[#6B6560] px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
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

      {/* Statements */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E0DDDA] p-12 text-center">
            <p className="text-sm text-[#6B6560]">No statements found.</p>
          </div>
        ) : filtered.map(stmt => (
          <div key={stmt.id} className={`bg-white rounded-2xl border overflow-hidden ${stmt.has_dispute ? 'border-red-300' : 'border-[#E0DDDA]'}`}>

            {/* Card Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-[#1B2A4A]">{stmt.seller_name}</p>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    {new Date(stmt.period_start).toLocaleDateString('en-GB')} — {new Date(stmt.period_end).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[stmt.status] ?? ''}`}>
                  {stmt.status}
                </span>
                {stmt.has_dispute && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                    ⚠ Disputed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-[#6B6560]">Net</p>
                  <p className="font-semibold text-green-600">{fmt(stmt.net_amount)}</p>
                </div>
                {stmt.status === 'draft' && (
                  <button onClick={() => handleSend(stmt.id)} disabled={actionLoading === stmt.id}
                    className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 disabled:opacity-50 transition">
                    Send to Seller
                  </button>
                )}
                {stmt.status === 'accepted' && (
                  <button onClick={() => handleMarkPaid(stmt.id)} disabled={actionLoading === stmt.id}
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

                {/* Seller Legal Info */}
                <div className="px-6 py-4 border-b border-[#E0DDDA]">
                  <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-3">Seller Legal Info</p>
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
                  <div><p className="text-xs text-[#6B6560]">Total Sales</p><p className="font-semibold text-[#1B2A4A]">{fmt(stmt.total_sales)}</p></div>
                  <div><p className="text-xs text-[#6B6560]">Total Fees</p><p className="font-semibold text-[#1B2A4A]">{fmt(stmt.total_fees)}</p></div>
                  <div>
                    <p className="text-xs text-[#6B6560]">Overall Discount</p>
                    {editingDiscount === stmt.id ? (
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex gap-2">
                          <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                            className="w-24 border border-[#E0DDDA] rounded px-2 py-1 text-xs" />
                          <button onClick={() => handleUpdateDiscount(stmt.id)} className="text-xs bg-[#1B2A4A] text-white px-2 py-1 rounded">Save</button>
                          <button onClick={() => setEditingDiscount(null)} className="text-xs text-[#6B6560]">✕</button>
                        </div>
                        <input value={discountDesc} onChange={e => setDiscountDesc(e.target.value)}
                          placeholder="Discount description..." className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-full" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-[#1B2A4A]">{fmt(stmt.overall_discount)}</p>
                          {stmt.discount_description && <p className="text-xs text-[#6B6560]">{stmt.discount_description}</p>}
                        </div>
                        {stmt.status === 'draft' && (
                          <button onClick={() => { setEditingDiscount(stmt.id); setDiscountValue(stmt.overall_discount); setDiscountDesc(stmt.discount_description) }}
                            className="text-xs text-[#C8952E] hover:underline">Edit</button>
                        )}
                      </div>
                    )}
                  </div>
                  <div><p className="text-xs text-[#6B6560]">Net Amount</p><p className="font-bold text-green-600 text-lg">{fmt(stmt.net_amount)}</p></div>
                </div>

                {/* Line Items */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide">Line Items</p>
                    {stmt.status === 'draft' && (
                      <button onClick={() => setAddingItemTo(stmt.id)}
                        className="text-xs text-[#C8952E] hover:underline">+ Add Item</button>
                    )}
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E0DDDA]">
                        <th className="text-left text-xs text-[#6B6560] pb-2">Type</th>
                        <th className="text-left text-xs text-[#6B6560] pb-2">Description</th>
                        <th className="text-right text-xs text-[#6B6560] pb-2">Amount</th>
                        <th className="text-right text-xs text-[#6B6560] pb-2">Discount</th>
                        <th className="text-right text-xs text-[#6B6560] pb-2">Net</th>
                        {stmt.status === 'draft' && <th className="pb-2" />}
                      </tr>
                    </thead>
                    <tbody>
                      {stmt.line_items.map(item => (
                        <tr key={item.id} className="border-b border-[#E0DDDA] last:border-0">
                          <td className="py-2">
                            <span className="text-xs bg-[#F5F4F0] text-[#6B6560] px-2 py-0.5 rounded">
                              {item.item_type}
                            </span>
                          </td>
                          <td className="py-2 text-[#1B2A4A]">
                            {editingItem === item.id ? (
                              <input value={editItemForm.description} onChange={e => setEditItemForm(p => ({ ...p, description: e.target.value }))}
                                className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-full" />
                            ) : item.description}
                          </td>
                          <td className="py-2 text-right text-[#1B2A4A]">
                            {editingItem === item.id ? (
                              <input type="number" value={editItemForm.amount} onChange={e => setEditItemForm(p => ({ ...p, amount: e.target.value }))}
                                className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-24 text-right" />
                            ) : fmt(item.amount)}
                          </td>
                          <td className="py-2 text-right text-[#6B6560]">
                            {editingItem === item.id ? (
                              <input type="number" value={editItemForm.discount} onChange={e => setEditItemForm(p => ({ ...p, discount: e.target.value }))}
                                className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-20 text-right" />
                            ) : fmt(item.discount)}
                          </td>
                          <td className="py-2 text-right font-semibold text-[#1B2A4A]">
                            {fmt(parseFloat(item.amount) - parseFloat(item.discount))}
                          </td>
                          {stmt.status === 'draft' && (
                            <td className="py-2 text-right">
                              {editingItem === item.id ? (
                                <div className="flex gap-1 justify-end">
                                  <button onClick={() => handleSaveItem(stmt.id, item.id)} className="text-xs bg-[#1B2A4A] text-white px-2 py-1 rounded">Save</button>
                                  <button onClick={() => setEditingItem(null)} className="text-xs text-[#6B6560]">✕</button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => { setEditingItem(item.id); setEditItemForm({ description: item.description, amount: item.amount, discount: item.discount }) }}
                                    className="text-xs text-[#C8952E] hover:underline">Edit</button>
                                  <button onClick={() => handleDeleteItem(stmt.id, item.id)}
                                    className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}

                      {/* Add Item Row */}
                      {addingItemTo === stmt.id && (
                        <tr className="border-b border-[#E0DDDA] bg-blue-50">
                          <td className="py-2">
                            <input value={newItem.item_type} onChange={e => setNewItem(p => ({ ...p, item_type: e.target.value }))}
                              placeholder="Type..." className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-24" />
                          </td>
                          <td className="py-2">
                            <input value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                              placeholder="Description..." className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-full" />
                          </td>
                          <td className="py-2">
                            <input type="number" value={newItem.amount} onChange={e => setNewItem(p => ({ ...p, amount: e.target.value }))}
                              placeholder="0.00" className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-24 text-right" />
                          </td>
                          <td className="py-2">
                            <input type="number" value={newItem.discount} onChange={e => setNewItem(p => ({ ...p, discount: e.target.value }))}
                              placeholder="0.00" className="border border-[#E0DDDA] rounded px-2 py-1 text-xs w-20 text-right" />
                          </td>
                          <td />
                          <td className="py-2">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => handleAddItem(stmt.id)} className="text-xs bg-[#C8952E] text-white px-2 py-1 rounded">Add</button>
                              <button onClick={() => setAddingItemTo(null)} className="text-xs text-[#6B6560]">✕</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Admin Notes */}
                <div className="px-6 py-4 border-t border-[#E0DDDA]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide">Admin Notes</p>
                    {stmt.status === 'draft' && editingNotes !== stmt.id && (
                      <button onClick={() => { setEditingNotes(stmt.id); setNotesValue(stmt.admin_notes ?? '') }}
                        className="text-xs text-[#C8952E] hover:underline">Edit</button>
                    )}
                  </div>
                  {editingNotes === stmt.id ? (
                    <div>
                      <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)}
                        rows={3} placeholder="Internal notes..."
                        className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none mb-2" />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateNotes(stmt.id)} className="text-xs bg-[#1B2A4A] text-white px-3 py-1.5 rounded">Save</button>
                        <button onClick={() => setEditingNotes(null)} className="text-xs text-[#6B6560]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#1B2A4A] whitespace-pre-wrap">{stmt.admin_notes || <span className="text-[#6B6560] italic">No notes</span>}</p>
                  )}
                </div>

                {/* Disputes */}
                {stmt.disputes.length > 0 && (
                  <div className="px-6 py-4 border-t border-[#E0DDDA]">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Disputes</p>
                    {stmt.disputes.map(dispute => (
                      <div key={dispute.id} className="bg-red-50 rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-red-700">
                            {new Date(dispute.created_at).toLocaleDateString('en-GB')} · {dispute.status}
                          </p>
                          {dispute.status === 'open' && (
                            <button onClick={() => setResolvingDispute({ stmtId: stmt.id, disputeId: dispute.id })}
                              className="text-xs text-[#1B2A4A] border border-[#E0DDDA] px-2 py-1 rounded hover:border-[#1B2A4A]">
                              Respond
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-red-800 mb-2"><span className="font-medium">Seller:</span> {dispute.seller_message}</p>
                        {dispute.admin_response && (
                          <p className="text-sm text-[#1B2A4A]"><span className="font-medium">Admin:</span> {dispute.admin_response}</p>
                        )}
                        {resolvingDispute?.disputeId === dispute.id && (
                          <div className="mt-3">
                            <textarea value={disputeResponse} onChange={e => setDisputeResponse(e.target.value)}
                              placeholder="Your response..." rows={2}
                              className="w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none mb-2" />
                            <div className="flex gap-2">
                              <button onClick={() => handleResolveDispute(stmt.id, dispute.id, 'resolved')}
                                className="bg-green-600 text-white px-3 py-1.5 rounded text-xs">Resolve</button>
                              <button onClick={() => handleResolveDispute(stmt.id, dispute.id, 'rejected')}
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs">Reject</button>
                              <button onClick={() => setResolvingDispute(null)} className="text-xs text-[#6B6560]">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer info */}
                {stmt.sent_at && (
                  <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs text-amber-700">
                      Sent on {new Date(stmt.sent_at).toLocaleDateString('en-GB')}
                      {stmt.auto_finalize_date && ` · Auto-finalizes on ${new Date(stmt.auto_finalize_date).toLocaleDateString('en-GB')}`}
                    </p>
                  </div>
                )}
                {stmt.status === 'paid' && stmt.paid_at && (
                  <div className="px-6 py-3 bg-green-50 border-t border-green-100">
                    <p className="text-xs text-green-700">Paid on {new Date(stmt.paid_at).toLocaleDateString('en-GB')}</p>
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