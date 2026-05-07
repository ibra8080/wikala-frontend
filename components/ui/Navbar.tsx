'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-[#E0DDDA] px-6 py-3 flex justify-between items-center sticky top-0 z-50">
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
      <div className="flex items-center gap-6">
        {user && (
          <>
            <span className="text-sm text-[#6B6560]">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm border border-[#E0DDDA] text-[#1B2A4A] px-4 py-1.5 rounded-lg hover:border-[#1B2A4A] transition"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}