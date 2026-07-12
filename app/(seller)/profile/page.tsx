'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

interface SellerProfile {
  id: number
  seller_id: string
  full_name: string
  business_name: string
  profile_pic_url: string
  bio: string
  phone: string
  whatsapp: string
  country: string
  city: string
  status: string
  rejection_reason: string
  approved_at: string | null
  created_at: string
  exported_before: boolean
  referral_source: string
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

const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 border-b border-[#F5F4F0] last:border-0">
      <p className="text-xs text-[#6B6560] mb-1">{label}</p>
      <p className="text-sm text-[#1B2A4A]">{value || '—'}</p>
    </div>
  )
}

function EditField({ label, field, type = 'text', multiline = false, editForm, setEditForm }: {
  label: string; field: string; type?: string; multiline?: boolean;
  editForm: Record<string, string>; setEditForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
    <div className="py-2">
      <label className="text-xs text-[#6B6560] mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={editForm[field] ?? ''} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
          rows={3} className={inputClass + ' resize-none'} />
      ) : (
        <input type={type} value={editForm[field] ?? ''} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
          className={inputClass} />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [pwOpen, setPwOpen] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const pwChecks = [
    { label: 'At least 8 characters', ok: pwForm.next.length >= 8 },
    { label: 'Not entirely numbers', ok: pwForm.next.length > 0 && !/^\d+$/.test(pwForm.next) },
    { label: 'Passwords match', ok: pwForm.next.length > 0 && pwForm.next === pwForm.confirm },
  ]

  const handleChangePassword = async () => {
    setPwSaving(true)
    setPwMessage(null)
    try {
      await api.post('/users/change-password/', {
        current_password: pwForm.current,
        password: pwForm.next,
        password2: pwForm.confirm,
      })
      setPwMessage({ type: 'success', text: 'Password changed successfully.' })
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[] | string> } })?.response?.data
      const msg =
        (typeof data?.current_password === 'string' ? data.current_password : '') ||
        (Array.isArray(data?.current_password) ? data.current_password[0] : '') ||
        (Array.isArray(data?.password) ? data.password[0] : typeof data?.password === 'string' ? data.password : '') ||
        (Array.isArray(data?.password2) ? data.password2[0] : typeof data?.password2 === 'string' ? data.password2 : '') ||
        'Something went wrong. Please try again.'
      setPwMessage({ type: 'error', text: msg })
    } finally {
      setPwSaving(false)
    }
  }

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/sellers/profile/')
      setProfile(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    void fetchProfile()
  }, [user, _hasHydrated, router, fetchProfile])

  const startEdit = (section: string, fields: Record<string, string>) => {
    setEditingSection(section)
    setEditForm(fields)
    setMessage(null)
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setEditForm({})
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.patch('/sellers/profile/', editForm)
      await fetchProfile()
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-[#6B6560]">Profile not found.</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">{profile.business_name}</h1>
          <p className="text-sm text-[#6B6560] mt-1">Seller ID: {profile.seller_id} · Member since {new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusStyles[profile.status] ?? ''}`}>
          {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
        </span>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Business Information */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1B2A4A]">Business Information</h2>
            {editingSection !== 'business' ? (
              <button onClick={() => startEdit('business', {
                full_name: profile.full_name, business_name: profile.business_name,
                bio: profile.bio, phone: profile.phone, whatsapp: profile.whatsapp,
                country: profile.country, city: profile.city,
              })} className="text-xs text-[#C8952E] hover:underline">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={cancelEdit} className="text-xs text-[#6B6560]">Cancel</button>
              </div>
            )}
          </div>
          {editingSection === 'business' ? (
            <>
              <EditField label="Full Name" field="full_name" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Business Name" field="business_name" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Phone" field="phone" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="WhatsApp" field="whatsapp" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Country" field="country" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="City" field="city" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Bio" field="bio" multiline editForm={editForm} setEditForm={setEditForm} />
            </>
          ) : (
            <>
              <Field label="Full Name" value={profile.full_name} />
              <Field label="Business Name" value={profile.business_name} />
              <Field label="Phone" value={profile.phone} />
              <Field label="WhatsApp" value={profile.whatsapp} />
              <Field label="Country" value={profile.country} />
              <Field label="City" value={profile.city} />
              <Field label="Bio" value={profile.bio} />
            </>
          )}
        </div>

        {/* Legal Information */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1B2A4A]">Legal Information</h2>
            {editingSection !== 'legal' ? (
              <button onClick={() => startEdit('legal', {
                legal_company_name: profile.legal_company_name, tax_id: profile.tax_id,
                commercial_register_no: profile.commercial_register_no, legal_address: profile.legal_address,
              })} className="text-xs text-[#C8952E] hover:underline">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={cancelEdit} className="text-xs text-[#6B6560]">Cancel</button>
              </div>
            )}
          </div>
          {editingSection === 'legal' ? (
            <>
              <EditField label="Legal Company Name" field="legal_company_name" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Tax ID" field="tax_id" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Commercial Register No." field="commercial_register_no" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Legal Address" field="legal_address" multiline editForm={editForm} setEditForm={setEditForm} />
            </>
          ) : (
            <>
              <Field label="Legal Company Name" value={profile.legal_company_name} />
              <Field label="Tax ID" value={profile.tax_id} />
              <Field label="Commercial Register No." value={profile.commercial_register_no} />
              <Field label="Legal Address" value={profile.legal_address} />
            </>
          )}
          {!profile.legal_company_name && !profile.tax_id && editingSection !== 'legal' && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-700">Please complete your legal information before your first statement is issued.</p>
            </div>
          )}
        </div>

        {/* Banking Information */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1B2A4A]">Banking Information</h2>
            {editingSection !== 'banking' ? (
              <button onClick={() => startEdit('banking', {
                bank_account_holder: profile.bank_account_holder, bank_name: profile.bank_name,
                bank_iban: profile.bank_iban, bank_swift: profile.bank_swift,
              })} className="text-xs text-[#C8952E] hover:underline">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={cancelEdit} className="text-xs text-[#6B6560]">Cancel</button>
              </div>
            )}
          </div>
          {editingSection === 'banking' ? (
            <>
              <EditField label="Account Holder Name" field="bank_account_holder" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="Bank Name" field="bank_name" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="IBAN" field="bank_iban" editForm={editForm} setEditForm={setEditForm} />
              <EditField label="BIC / SWIFT" field="bank_swift" editForm={editForm} setEditForm={setEditForm} />
            </>
          ) : (
            <>
              <Field label="Account Holder Name" value={profile.bank_account_holder} />
              <Field label="Bank Name" value={profile.bank_name} />
              <Field label="IBAN" value={profile.bank_iban} />
              <Field label="BIC / SWIFT" value={profile.bank_swift} />
            </>
          )}
          {!profile.bank_iban && editingSection !== 'banking' && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-700">Add your banking details to receive payments from Wikala.</p>
            </div>
          )}
        </div>

        {/* Account Details (read-only) */}
        <div className="bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Account Details</h2>
          <Field label="Email" value={user?.email ?? ''} />
          <Field label="Seller ID" value={profile.seller_id} />
          <Field label="Account Status" value={profile.status.charAt(0).toUpperCase() + profile.status.slice(1)} />
          <Field label="Member Since" value={new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {profile.approved_at && (
            <Field label="Approved On" value={new Date(profile.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
          <Field label="Exported Before" value={profile.exported_before ? 'Yes' : 'No'} />
        </div>

        {/* Change Password */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0DDDA] p-6">
          <button
            type="button"
            onClick={() => setPwOpen((o) => !o)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-semibold text-[#1B2A4A]">Change Password</h2>
            <svg
              className={`w-5 h-5 text-[#6B6560] transition-transform ${pwOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`max-w-md space-y-4 ${pwOpen ? 'mt-4' : 'hidden'}`}>
            <div>
              <label className="text-xs text-[#6B6560] mb-1 block">Current password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  autoComplete="current-password"
                  className={inputClass + ' pr-12'}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-xs text-[#6B6560] hover:text-[#1B2A4A]">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#6B6560] mb-1 block">New password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-[#6B6560] mb-1 block">Confirm new password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <ul className="space-y-1">
              {pwChecks.map((c) => (
                <li key={c.label}
                  className={`text-xs flex items-center gap-1.5 transition-colors ${c.ok ? 'text-green-600' : 'text-[#6B6560]'}`}>
                  <span>{c.ok ? '✓' : '○'}</span>
                  {c.label}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-[#6B6560]">Very common passwords will be rejected.</p>

            {pwMessage && (
              <p className={`text-sm ${pwMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {pwMessage.text}
              </p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !pwChecks.every((c) => c.ok) || !pwForm.current}
              className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
