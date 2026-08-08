'use client'
import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/axios'
import Link from 'next/link'

interface InventoryRow {
  id: number
  variant_sku: string
  variant_color: string
  variant_size: string
  product_name: string
  product_code: string
  seller_name: string
  quantity_in_egypt: number
  quantity_in_transit: number
  quantity_in_germany: number
  quantity_sold: number
  quantity_available: number
}

interface Props {
  warehouse: 'egypt' | 'germany'
}

export default function WarehouseInventory({ warehouse }: Props) {
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})
  const [search, setSearch] = useState('')

  const qtyField = warehouse === 'egypt' ? 'quantity_in_egypt' : 'quantity_in_germany'
  const title = warehouse === 'egypt' ? 'Egypt Warehouse' : 'Germany Warehouse'

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/admin/list/')
      setRows(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    api.get('/inventory/admin/list/')
      .then(res => {
        if (!ignore) setRows(res.data)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [])

  const handleSave = async (row: InventoryRow) => {
    const raw = editValues[row.id]
    if (raw === undefined) return
    const value = parseInt(raw)
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid non-negative number.')
      return
    }
    setSavingId(row.id)
    try {
      await api.patch(`/inventory/admin/${row.id}/`, { [qtyField]: value })
      await fetchInventory()
      setEditValues(prev => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
    } catch {
      alert('Failed to update quantity. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    return (
      r.variant_sku?.toLowerCase().includes(q) ||
      r.product_name?.toLowerCase().includes(q) ||
      r.product_code?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/warehouses" className="text-sm text-[#6B6560] hover:text-[#1B2A4A]">← Back to Warehouses</Link>
        <h1 className="text-2xl font-bold text-[#1B2A4A] mt-2">{title}</h1>
        <p className="text-sm text-[#6B6560] mt-1">
          {warehouse === 'egypt'
            ? 'Manually adjust stock quantities held in the Egypt warehouse.'
            : 'Manually adjust stock quantities available in the Germany warehouse.'}
        </p>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by SKU, product name, or code..."
        className="w-full max-w-md mb-6 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A]"
      />

      <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
              {['Product', 'SKU', 'Variant', 'Seller', warehouse === 'egypt' ? 'In Egypt' : 'In Germany', 'Qty'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const currentQty = row[qtyField]
              const edited = editValues[row.id]
              const isDirty = edited !== undefined && edited !== String(currentQty)
              return (
                <tr key={row.id} className="border-b border-[#E0DDDA] last:border-0 hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1B2A4A]">{row.product_name}</p>
                    <p className="text-xs text-[#6B6560] font-mono">{row.product_code}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B6560] whitespace-nowrap">{row.variant_sku}</td>
                  <td className="px-4 py-3 text-xs text-[#6B6560] whitespace-nowrap">
                    {[row.variant_color, row.variant_size].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6B6560]">{row.seller_name}</td>
                  <td className="px-4 py-3 font-semibold text-[#1B2A4A]">{currentQty}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={edited ?? String(currentQty)}
                        onChange={e => setEditValues(prev => ({ ...prev, [row.id]: e.target.value }))}
                        className="w-20 border border-[#E0DDDA] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#1B2A4A]"
                      />
                      {isDirty && (
                        <button
                          onClick={() => handleSave(row)}
                          disabled={savingId === row.id}
                          className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 whitespace-nowrap"
                        >
                          {savingId === row.id ? '...' : 'Save'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6B6560]">No inventory found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}