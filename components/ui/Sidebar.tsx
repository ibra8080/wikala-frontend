'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const sellerLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Profile', href: '/profile' },
  { label: 'Products', href: '/products' },
  { label: 'My Sales', href: '/sales' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Statements', href: '/statements' },
  { label: 'Messages', href: '/messages' },
  { label: 'Help Center', href: '/help' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  const navContent = (
    <>
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
    </>
  )

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#F5F4F0] border-b border-[#E0DDDA] sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-1.5 text-[#1B2A4A]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-widest">
          Seller Portal
        </p>
      </div>

      {/* Desktop sidebar (static) */}
      <aside className="hidden md:flex w-56 min-h-full bg-[#F5F4F0] border-r border-[#E0DDDA] pt-6 flex-col">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-[#1B2A4A]/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-64 max-w-[80%] h-full bg-[#F5F4F0] border-r border-[#E0DDDA] pt-6 flex flex-col shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 p-1.5 text-[#6B6560] hover:text-[#1B2A4A]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}