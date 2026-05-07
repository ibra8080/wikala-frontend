'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sellerLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: '▪' },
  { label: 'Products', href: '/products', icon: '▪' },
  { label: 'Inventory', href: '/inventory', icon: '▪' },
  { label: 'Statements', href: '/statements', icon: '▪' },
  { label: 'Messages', href: '/messages', icon: '▪' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-full bg-[#F5F4F0] border-r border-[#E0DDDA] pt-6 flex flex-col">
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-widest">
          Seller Portal
        </p>
      </div>

      <nav className="flex-1 px-2">
        {sellerLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition
                ${isActive
                  ? 'bg-[#EEECEA] text-[#1B2A4A] font-semibold border-r-2 border-[#C8952E]'
                  : 'text-[#6B6560] hover:bg-[#EEECEA] hover:text-[#1B2A4A]'
                }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}