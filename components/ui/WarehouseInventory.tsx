'use client'
import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
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
  bin_location_egypt: string
  bin_location_germany: string
  created_at: string | null
}

interface Props {
  warehouse: 'egypt' | 'germany'
}

type FilterMode = 'all' | 'in_stock' | 'empty'
type SortMode = 'code' | 'qty_desc' | 'qty_asc' | 'recent'

export default function WarehouseInventory({ warehouse }: Props) {
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})
  const [savingBinId, setSavingBinId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('code')
  const [scanValue, setScanValue] = useState('')
  const [scanMsg, setScanMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  const qtyField = warehouse === 'egypt' ? 'quantity_in_egypt' : 'quantity_in_germany'
  const binField = warehouse === 'egypt' ? 'bin_location_egypt' : 'bin_location_germany'
  const title = warehouse === 'egypt' ? 'Egypt Warehouse' : 'Germany Warehouse'
  const qtyLabel = warehouse === 'egypt' ? 'In Egypt' : 'In Germany'

  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get('/inventory/admin/list/')
      setRows(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  // Keep scan field focused
  useEffect(() => {
    scanRef.current?.focus()
  }, [loading])

  const patchQty = async (row: InventoryRow, value: number) => {
    const res = await api.patch(`/inventory/admin/${row.id}/`, { [qtyField]: value })
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, ...res.data } : r)))
    return res.data
  }

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
      await patchQty(row, value)
      setEditValues(prev => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
    } catch {
      alert('Failed to update quantity.')
    } finally {
      setSavingId(null)
    }
  }

  const saveBin = async (row: InventoryRow, value: string) => {
    if (value === ((row as unknown as Record<string, string>)[binField] ?? '')) return
    setSavingBinId(row.id)
    try {
      const res = await api.patch(`/inventory/admin/${row.id}/bin-location/`, { [binField]: value })
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, ...res.data } : r)))
    } catch {
      alert('Failed to update bin location.')
    } finally {
      setSavingBinId(null)
    }
  }

  // Scanner: SKU + Enter → +1 on that variant
  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const sku = scanValue.trim()
    if (!sku) return
    const row = rows.find(r => r.variant_sku?.toLowerCase() === sku.toLowerCase())
    setScanValue('')
    if (!row) {
      setScanMsg({ type: 'err', text: `SKU not found: ${sku}` })
      return
    }
    const current = (row as unknown as Record<string, number>)[qtyField]
    try {
      const updated = await patchQty(row, current + 1)
      const newQty = (updated as Record<string, number>)[qtyField]
      setScanMsg({ type: 'ok', text: `${row.product_name} (${sku}): ${current} → ${newQty}` })
    } catch {
      setScanMsg({ type: 'err', text: `Failed to update ${sku}` })
    }
  }

  const sellers = useMemo(
    () => [...new Set(rows.map(r => r.seller_name).filter(Boolean))].sort(),
    [rows]
  )

  const binSuggestions = useMemo(
    () => [...new Set(rows.map(r => (r as unknown as Record<string, string>)[binField]).filter(Boolean))].sort(),
    [rows, binField]
  )

  const filteredSorted = useMemo(() => {
    let list = [...rows]
    // search
    const q = search.toLowerCase()
    if (q) {
      list = list.filter(r =>
        r.variant_sku?.toLowerCase().includes(q) ||
        r.product_name?.toLowerCase().includes(q) ||
        r.product_code?.toLowerCase().includes(q) ||
        ((r as unknown as Record<string, string>)[binField] ?? '').toLowerCase().includes(q)
      )
    }
    // filter by seller
    if (sellerFilter !== 'all') list = list.filter(r => r.seller_name === sellerFilter)
    // filter by stock
    const getQty = (r: InventoryRow) => (r as unknown as Record<string, number>)[qtyField]
    if (filterMode === 'in_stock') list = list.filter(r => getQty(r) > 0)
    else if (filterMode === 'empty') list = list.filter(r => getQty(r) === 0)
    // sort
    if (sortMode === 'qty_desc') list.sort((a, b) => getQty(b) - getQty(a))
    else if (sortMode === 'qty_asc') list.sort((a, b) => getQty(a) - getQty(b))
    else if (sortMode === 'recent') list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    else list.sort((a, b) => (a.product_code || '').localeCompare(b.product_code || '') || (a.variant_sku || '').localeCompare(b.variant_sku || ''))
    return list
  }, [rows, search, filterMode, sortMode, qtyField, sellerFilter, binField])

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
          Scan a barcode to add +1, or adjust quantities manually.
        </p>
      </div>

      <datalist id="bin-suggestions">
        {binSuggestions.map(b => <option key={b} value={b} />)}
      </datalist>

      {/* Scan field */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#6B6560] mb-1">📷 Scan barcode (SKU + Enter → +1)</label>
        <input
          ref={scanRef}
          value={scanValue}
          onChange={e => setScanValue(e.target.value)}
          onKeyDown={handleScan}
          placeholder="Focus here and scan..."
          className="w-full max-w-md border-2 border-[#C8952E] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] font-mono"
        />
        {scanMsg && (
          <p className={`text-sm mt-2 ${scanMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {scanMsg.type === 'ok' ? '✓ ' : '✗ '}{scanMsg.text}
          </p>
        )}
      </div>

      {/* Toolbar: search + filter + sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU, name, or code..."
          className="flex-1 min-w-[200px] border border-[#E0DDDA] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]"
        />
        <select value={filterMode} onChange={e => setFilterMode(e.target.value as FilterMode)}
          className="border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]">
          <option value="all">All stock</option>
          <option value="in_stock">In stock ({'>'} 0)</option>
          <option value="empty">Empty (0)</option>
        </select>
        <select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}
          className="border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]">
          <option value="all">All sellers</option>
          {sellers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}
          className="border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A]">
          <option value="code">Sort: Product code</option>
          <option value="qty_desc">Sort: Quantity (high → low)</option>
          <option value="qty_asc">Sort: Quantity (low → high)</option>
          <option value="recent">Sort: Recently added</option>
        </select>
        <span className="text-sm text-[#6B6560] font-medium whitespace-nowrap">
          {filteredSorted.length} item{filteredSorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E0DDDA] bg-[#F5F4F0]">
              {['Product', 'SKU', 'Variant', 'Seller', qtyLabel, 'Qty', 'Bin'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSorted.map(row => {
              const currentQty = (row as unknown as Record<string, number>)[qtyField]
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
                        <button onClick={() => handleSave(row)} disabled={savingId === row.id}
                          className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 whitespace-nowrap">
                          {savingId === row.id ? '...' : 'Save'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      maxLength={50}
                      list="bin-suggestions"
                      defaultValue={(row as unknown as Record<string, string>)[binField] ?? ''}
                      onBlur={e => saveBin(row, e.target.value)}
                      disabled={savingBinId === row.id}
                      placeholder="—"
                      className="w-28 border border-[#E0DDDA] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#1B2A4A] disabled:opacity-50"
                    />
                  </td>
                </tr>
              )
            })}
            {filteredSorted.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6B6560]">No inventory found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}