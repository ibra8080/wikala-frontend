'use client'

import Link from 'next/link'

const sections = [
  {
    href: '/admin/warehouses/tracking',
    title: 'Shipment Tracking',
    desc: 'Update product status through shipping stages',
    icon: '🚚',
    color: 'border-[#C8952E] hover:border-[#C8952E]',
  },
  {
    href: '/admin/warehouses/egypt',
    title: 'Egypt Warehouse',
    desc: 'Products received and stored in Egypt',
    icon: '🏭',
    color: 'border-[#E0DDDA] hover:border-[#C8952E]',
  },
  {
    href: '/admin/warehouses/germany',
    title: 'Germany Warehouse',
    desc: 'Products arrived and available in Germany',
    icon: '🇩🇪',
    color: 'border-[#E0DDDA] hover:border-[#C8952E]',
  },
]

export default function WarehousesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Warehouses</h1>
        <p className="text-sm text-[#6B6560] mt-1">Manage product movement and warehouse inventory</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {sections.map(s => (
          <Link key={s.href} href={s.href}
            className={`bg-white rounded-2xl border-2 p-8 transition group ${s.color}`}>
            <p className="text-4xl mb-4">{s.icon}</p>
            <h2 className="font-semibold text-[#1B2A4A] text-lg group-hover:text-[#C8952E] transition">
              {s.title}
            </h2>
            <p className="text-sm text-[#6B6560] mt-1">{s.desc}</p>
            <p className="text-[#C8952E] mt-4 text-sm">Go →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}