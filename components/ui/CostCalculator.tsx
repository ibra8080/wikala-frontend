'use client'

import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

// Admin-editable, hidden from user
const SHIPPING_PER_KG = 10
const STORAGE_PER_M3_MONTH = 25
const AVG_STORAGE_DAYS = 15
const PACKING_FEE = 1
const VAT_RATE = 0.19
const COMMISSION_RATE = 0.15

const euro = (n: number) =>
  n.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' })

const inputClass =
  'w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition'

export default function CostCalculator({ open, onClose }: Props) {
  const [mode, setMode] = useState<'price' | 'suggest'>('price')
  const [production, setProduction] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('') // grams
  const [sellPrice, setSellPrice] = useState('')

  if (!open) return null

  const prod = parseFloat(production) || 0
  const l = parseFloat(length) || 0
  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const grams = parseFloat(weight) || 0

  // Logistics (independent of sell price)
  const shipping = (grams / 1000) * SHIPPING_PER_KG
  const volumeM3 = (l * w * h) / 1_000_000
  const storage = volumeM3 * STORAGE_PER_M3_MONTH * (AVG_STORAGE_DAYS / 30)
  const packing = PACKING_FEE
  const preSaleCost = prod + shipping + storage + packing

  // Minimum price → net profit equals production cost
  const minPrice =
    (2 * prod + shipping + storage + packing) / (1 - VAT_RATE - COMMISSION_RATE)

  const effectivePrice =
    mode === 'suggest' ? minPrice : parseFloat(sellPrice) || 0

  const vat = effectivePrice * VAT_RATE
  const commission = effectivePrice * COMMISSION_RATE
  const netProfit =
    effectivePrice - vat - commission - shipping - storage - packing - prod

  const hasInputs = prod > 0 && l > 0 && w > 0 && h > 0 && grams > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-[#1B2A4A]/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#E0DDDA] shadow-xl max-w-lg w-full p-6 my-8 sm:my-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-[#1B2A4A]">Profit Calculator</h3>
          <button
            onClick={onClose}
            className="text-[#6B6560] hover:text-[#1B2A4A] text-xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-[#6B6560] mb-5">
          Estimate your costs and profit before selling on Wikala.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-[#F5F4F0] rounded-lg mb-5">
          <button
            onClick={() => setMode('price')}
            className={`flex-1 text-sm py-2 rounded-md transition ${
              mode === 'price'
                ? 'bg-white text-[#1B2A4A] font-medium shadow-sm'
                : 'text-[#6B6560]'
            }`}
          >
            Enter my price
          </button>
          <button
            onClick={() => setMode('suggest')}
            className={`flex-1 text-sm py-2 rounded-md transition ${
              mode === 'suggest'
                ? 'bg-white text-[#1B2A4A] font-medium shadow-sm'
                : 'text-[#6B6560]'
            }`}
          >
            Suggest minimum price
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#6B6560] mb-1">
              Unit production cost (€)
            </label>
            <input
              type="number"
              value={production}
              onChange={(e) => setProduction(e.target.value)}
              className={inputClass}
              placeholder="e.g. 10"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Length (cm)</label>
              <input type="number" value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Width (cm)</label>
              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Height (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#6B6560] mb-1">
              Unit weight (grams)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={inputClass}
              placeholder="e.g. 500"
            />
          </div>

          {mode === 'price' && (
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">
                Your selling price (€)
              </label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className={inputClass}
                placeholder="e.g. 40"
              />
            </div>
          )}
        </div>

        {/* Results */}
        {hasInputs && (
          <div className="mt-5 bg-[#FAFAF8] border border-[#E0DDDA] rounded-xl p-4 space-y-2.5">
            <Row label="Your production cost" value={euro(prod)} />
            <Row
              label="Product cost before sale (in Germany)"
              value={euro(preSaleCost)}
              hint="Includes production, international shipping & customs, storage, and packing."
            />

            {mode === 'suggest' ? (
              <Row
                label="Minimum selling price"
                value={euro(minPrice)}
                strong
                hint="At this price, your net profit equals your production cost."
              />
            ) : (
              effectivePrice > 0 && (
                <Row
                  label="Your net profit"
                  value={euro(netProfit)}
                  strong
                  positive={netProfit >= 0}
                />
              )
            )}

            {mode === 'price' && effectivePrice > 0 && (
              <Row label="Suggested minimum price" value={euro(minPrice)} muted />
            )}

            <p className="text-[10px] text-[#6B6560] pt-2 border-t border-[#E0DDDA] leading-relaxed">
              Storage is estimated over an average of {AVG_STORAGE_DAYS} days
              before sale. Actual logistics fees appear on your statement after
              each sale.
            </p>
          </div>
        )}

        {!hasInputs && (
          <p className="mt-5 text-center text-xs text-[#6B6560]">
            Fill in your product details to see the results.
          </p>
        )}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  hint,
  strong = false,
  muted = false,
  positive = true,
}: {
  label: string
  value: string
  hint?: string
  strong?: boolean
  muted?: boolean
  positive?: boolean
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-sm ${muted ? 'text-[#6B6560]' : 'text-[#1B2A4A]'}`}>
          {label}
        </span>
        <span
          className={`text-sm font-semibold whitespace-nowrap ${
            muted
              ? 'text-[#6B6560]'
              : strong
              ? positive
                ? 'text-[#C8952E]'
                : 'text-red-600'
              : 'text-[#1B2A4A]'
          }`}
        >
          {value}
        </span>
      </div>
      {hint && <p className="text-[10px] text-[#6B6560] mt-0.5">{hint}</p>}
    </div>
  )
}