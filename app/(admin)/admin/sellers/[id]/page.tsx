'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'
import Link from 'next/link'

interface Seller {
  id: number
  seller_id: string
  email: string
  full_name: string
  business_name: string
  bio: string
  phone: string
  whatsapp: string
  country: string
  city: string
  status: string
  rejection_reason: string
  exported_before: boolean
  referral_source: string
  approved_at: string | null
  created_at: string
  legal_company_name: string
  tax_id: string
  commercial_register_no: string
  legal_address: string
  bank_account_holder: string
  bank_name: string
  bank_iban: string
  bank_swift: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 border-b border-[#F5F4F0] last:border-0">
      <p className="text-xs text-[#6B6560] mb-1">{label}</p>
      <p className="text-sm text-[#1B2A4A]">{value || '—'}</p>
    </div>
  )
}

export default function AdminSellerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, _hasHydrated } = useAuthStore()
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSeller = useCallback(async () => {
    try {
      const res = await api.get(`/sellers/admin/${params.id}/`)
      setSeller(res.data)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchSeller()
  }, [user, _hasHydrated, router, fetchSeller])

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      await api.patch(`/sellers/admin/${seller!.id}/`, { status: newStatus })
      await fetchSeller()
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this seller and all their data? This cannot be undone.')) return
    setActionLoading(true)
    try {
      await api.delete(`/sellers/admin/${seller!.id}/`)
      router.push('/admin/sellers')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!seller) return (
    <div className="text-center py-16">
      <p className="text-[#6B6560]">Seller not found.</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin/sellers" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">
          ← Back to Sellers
        </Link>
        <div className="flex gap-3">
          {seller.status === 'pending' && (
            <>
              <button onClick={() => handleStatusChange('approved')} disabled={actionLoading}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
                Approve
              </button>
              <button onClick={() => handleStatusChange('rejected')} disabled={actionLoading}
                className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition">
                Reject
              </button>
            </>
          )}
          {seller.status === 'approved' && (
            <button onClick={() => handleStatusChange('suspended')} disabled={actionLoading}
              className="bg-gray-50 text-gray-600 border border-gray-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition">
              Suspend
            </button>
          )}
          {seller.status === 'suspended' && (
            <button onClick={() => handleStatusChange('approved')} disabled={actionLoading}
              className="bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 transition">
              Reactivate
            </button>
          )}
          <button onClick={handleDelete} disabled={actionLoading}
            className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition">
            Delete Seller
          </button>
        </div>
      </div>

      {/* Seller Header */}
      <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">{seller.business_name}</h1>
            <p className="text-sm text-[#6B6560] mt-1">{seller.full_name} · {seller.seller_id}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusStyles[seller.status] ?? ''}`}>
            {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
          </span>
        </div>
        {seller.status === 'rejected' && seller.rejection_reason && (
          <div className="mt-4 bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{seller.rejection_reason}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Business Information */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Business Information</h2>
          <Field label="Full Name" value={seller.full_name} />
          <Field label="Email" value={seller.email ?? '—'} />
          <Field label="Business Name" value={seller.business_name} />
          <Field label="Phone" value={seller.phone} />
          <Field label="WhatsApp" value={seller.whatsapp} />
          <Field label="Country" value={seller.country} />
          <Field label="City" value={seller.city} />
          <Field label="Bio" value={seller.bio} />
          <Field label="Exported Before" value={seller.exported_before ? 'Yes' : 'No'} />
          <Field label="Referral Source" value={seller.referral_source} />
        </div>

        {/* Legal Information */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Legal Information</h2>
          <Field label="Legal Company Name" value={seller.legal_company_name} />
          <Field label="Tax ID" value={seller.tax_id} />
          <Field label="Commercial Register No." value={seller.commercial_register_no} />
          <Field label="Legal Address" value={seller.legal_address} />
          {!seller.legal_company_name && !seller.tax_id && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-700">Seller has not provided legal information yet.</p>
            </div>
          )}
        </div>

        {/* Banking Information */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Banking Information</h2>
          <Field label="Account Holder" value={seller.bank_account_holder} />
          <Field label="Bank Name" value={seller.bank_name} />
          <Field label="IBAN" value={seller.bank_iban} />
          <Field label="BIC / SWIFT" value={seller.bank_swift} />
          {!seller.bank_iban && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-700">Seller has not provided banking details yet.</p>
            </div>
          )}
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Account Details</h2>
          <Field label="Seller ID" value={seller.seller_id} />
          <Field label="Status" value={seller.status.charAt(0).toUpperCase() + seller.status.slice(1)} />
          <Field label="Registered" value={new Date(seller.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {seller.approved_at && (
            <Field label="Approved" value={new Date(seller.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
        </div>

      </div>
    </div>
  )
}