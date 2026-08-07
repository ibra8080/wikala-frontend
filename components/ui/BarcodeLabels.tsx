'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import JsBarcode from 'jsbarcode'

interface LabelItem {
  sku: string
  productName: string
  color?: string
  size?: string
}

interface Props {
  open: boolean
  onClose: () => void
  items: LabelItem[]
}

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: 'CODE128',
          width: 1.6,
          height: 45,
          fontSize: 12,
          margin: 4,
          displayValue: false,
        })
      } catch {
        // invalid barcode value — skip
      }
    }
  }, [value])
  return <svg ref={ref} />
}

export default function BarcodeLabels({ open, onClose, items }: Props) {
  if (!open) return null

  const validVariants = items.filter((v) => v.sku && v.sku.trim())

  const handlePrint = () => window.print()

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-[#1B2A4A]/40 backdrop-blur-sm overflow-y-auto print:bg-white print:inset-auto print:relative">
      <div className="min-h-full flex items-start justify-center p-4 print:p-0 print:block">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 print:my-0 print:max-w-none print:rounded-none print:shadow-none">
          {/* Header — hidden on print */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DDDA] print:hidden">
            <h3 className="font-semibold text-[#1B2A4A]">Print Barcode Labels</h3>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint}
                className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243860] transition">
                Print
              </button>
              <button onClick={onClose}
                className="text-[#6B6560] hover:text-[#1B2A4A] text-xl leading-none px-2">×</button>
            </div>
          </div>

          {validVariants.length === 0 ? (
            <p className="p-6 text-sm text-[#6B6560] print:hidden">No variants with a valid SKU to print.</p>
          ) : (
            <div className="p-6 grid grid-cols-2 gap-4 print:grid-cols-3 print:gap-2 print:p-2">
              {validVariants.map((v, i) => (
                <div key={i}
                  className="border border-[#E0DDDA] rounded-lg p-3 flex flex-col items-center text-center print:border-black/30 break-inside-avoid">
                  <p className="text-[11px] font-medium text-[#1B2A4A] leading-tight mb-1 line-clamp-2">
                    {v.productName}
                  </p>
                  {(v.color || v.size) && (
                    <p className="text-[10px] text-[#6B6560] mb-1">
                      {[v.color, v.size].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <Barcode value={v.sku} />
                  <p className="font-mono text-[11px] text-[#1B2A4A] mt-1 tracking-wide">{v.sku}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
