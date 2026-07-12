'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import CostCalculator from '@/components/ui/CostCalculator'

export default function Navbar() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()
  const [calcOpen, setCalcOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-[#E0DDDA] px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-50 gap-2">
      {/* Logo */}
      <Link href="/dashboard">
        <Image
          src="/icons/wikala_Logo.svg"
          alt="Wikala"
          width={120}
          height={36}
          priority
        />
      </Link>

      {/* Right Side */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {user && (
          <>
            <span className="hidden lg:inline text-sm text-[#6B6560] truncate max-w-[200px]">{user.email}</span>
            <button
              onClick={() => setCalcOpen(true)}
              className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition whitespace-nowrap"
            >
              <span className="hidden sm:inline">Profit </span>Calculator
            </button>
            <button
              onClick={handleLogout}
              className="text-sm border border-[#E0DDDA] text-[#1B2A4A] px-3 sm:px-4 py-1.5 rounded-lg hover:border-[#1B2A4A] transition whitespace-nowrap"
            >
              Sign out
            </button>
          </>
        )}
      </div>
      <CostCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />
    </nav>
  )
}