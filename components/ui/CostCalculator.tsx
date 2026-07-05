'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

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

  // Minimum price → net profit equals production cost
  const minPrice =
    (2 * prod + shipping + storage + packing) / (1 - VAT_RATE - COMMISSION_RATE)

  const effectivePrice =
    mode === 'suggest' ? minPrice : parseFloat(sellPrice) || 0

  const vat = effectivePrice * VAT_RATE
  const commission = effectivePrice * COMMISSION_RATE
  const totalCost = prod + shipping + storage + packing + vat + commission
  const netProfit = effectivePrice - totalCost

  const hasInputs = prod > 0 && l > 0 && w > 0 && h > 0 && grams > 0

  return createPortal(
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
            <p className="text-[10px] text-[#6B6560] mt-1">
              Enter the cost in euros (€). Convert from EGP using the current
              exchange rate before entering.
            </p>
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
          <div className="mt-5 bg-[#FAFAF8] border border-[#E0DDDA] rounded-xl p-4 space-y-2">
            <ul className="space-y-2">
              <LineItem label="Production cost" value={euro(prod)} />
              <LineItem label="Shipping & customs" value={euro(shipping)} />
              <LineItem
                label={`Storage (~${AVG_STORAGE_DAYS} days)`}
                value={euro(storage)}
              />
              <LineItem label="Pick & pack" value={euro(packing)} />
              <LineItem label="VAT (19%)" value={euro(vat)} />
              <LineItem label="Wikala commission (15%)" value={euro(commission)} />
            </ul>

            <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-[#E0DDDA]">
              <span className="text-sm font-semibold text-[#1B2A4A]">
                Total cost
              </span>
              <span className="text-sm font-bold text-[#1B2A4A] whitespace-nowrap">
                {euro(totalCost)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-[#6B6560]">
                {mode === 'suggest' ? 'Minimum selling price' : 'Selling price'}
              </span>
              <span className="text-sm text-[#6B6560] whitespace-nowrap">
                {euro(effectivePrice)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-[#E0DDDA]">
              <span className="text-base font-semibold text-[#1B2A4A]">
                {mode === 'suggest' ? 'Minimum selling price' : 'Your net profit'}
              </span>
              <span
                className={`text-base font-bold whitespace-nowrap ${
                  mode === 'suggest'
                    ? 'text-[#C8952E]'
                    : netProfit >= 0
                    ? 'text-[#C8952E]'
                    : 'text-red-600'
                }`}
              >
                {mode === 'suggest' ? euro(minPrice) : euro(netProfit)}
              </span>
            </div>

            {mode === 'suggest' && (
              <p className="text-[10px] text-[#6B6560]">
                At this price, your net profit equals your production cost ({euro(prod)}).
              </p>
            )}
            {mode === 'price' && effectivePrice > 0 && (
              <div className="flex items-baseline justify-between gap-3 text-[#6B6560]">
                <span className="text-xs">Suggested minimum price</span>
                <span className="text-xs whitespace-nowrap">{euro(minPrice)}</span>
              </div>
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
    </div>,
    document.body
  )
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-[#1B2A4A]">{label}</span>
      <span className="text-sm text-[#1B2A4A] whitespace-nowrap">{value}</span>
    </li>
  )
}