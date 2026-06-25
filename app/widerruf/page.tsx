'use client'

import { useState } from 'react'
import PublicNavbar from '@/components/ui/PublicNavbar'
import PublicFooter from '@/components/ui/PublicFooter'

type Lang = 'en' | 'ar'

type Step = 'form' | 'confirm' | 'success'

interface FormData {
  name: string
  email: string
  bestellnummer: string
  widerrufserklaerung: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function WiderrufPage() {
  const [lang, setLang] = useState<Lang>('en')
  const [step, setStep] = useState<Step>('form')
  const [data, setData] = useState<FormData>({
    name: '',
    email: '',
    bestellnummer: '',
    widerrufserklaerung: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof FormData, value: string) => {
    setData((d) => ({ ...d, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormData, string>> = {}
    if (!data.name.trim()) next.name = 'Bitte geben Sie Ihren Namen ein.'
    if (!data.email.trim()) {
      next.email = 'Bitte geben Sie Ihre E-Mail-Adresse ein.'
    } else if (!EMAIL_RE.test(data.email.trim())) {
      next.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    }
    if (!data.bestellnummer.trim()) next.bestellnummer = 'Bitte geben Sie Ihre Bestellnummer ein.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleContinue = () => {
    setSubmitError('')
    if (validate()) setStep('confirm')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${API_URL}/legal/widerruf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          bestellnummer: data.bestellnummer.trim(),
          widerrufserklaerung: data.widerrufserklaerung.trim(),
        }),
      })
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Zu viele Anfragen. Bitte versuchen Sie es später erneut.')
        }
        throw new Error('Beim Absenden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.')
      }
      setStep('success')
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Beim Absenden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <PublicNavbar lang={lang} onLangChange={setLang} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B2A4A] mb-3">Widerruf</h1>
          <p className="text-[#6B6560] leading-relaxed">
            Mit diesem Formular können Sie Ihren Vertrag widerrufen. Nach dem
            Absenden erhalten Sie umgehend eine Eingangsbestätigung per E-Mail.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-8 text-sm">
          <StepDot active={step === 'form'} done={step !== 'form'} label="1" />
          <div className="h-px flex-1 bg-[#E0DDDA]" />
          <StepDot active={step === 'confirm'} done={step === 'success'} label="2" />
          <div className="h-px flex-1 bg-[#E0DDDA]" />
          <StepDot active={step === 'success'} done={false} label="3" />
        </div>

        {step === 'form' && (
          <div className="bg-white rounded-xl border border-[#E0DDDA] p-6 sm:p-8">
            <div className="space-y-5">
              <Field label="Name" required value={data.name} onChange={(v) => update('name', v)} error={errors.name} placeholder="Vor- und Nachname" />
              <Field label="E-Mail-Adresse" required type="email" value={data.email} onChange={(v) => update('email', v)} error={errors.email} placeholder="ihre@email.de" />
              <Field label="Bestellnummer" required value={data.bestellnummer} onChange={(v) => update('bestellnummer', v)} error={errors.bestellnummer} placeholder="z. B. #1234" />
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Widerrufserklärung <span className="text-[#6B6560] font-normal">(optional)</span>
                </label>
                <textarea
                  value={data.widerrufserklaerung}
                  onChange={(e) => update('widerrufserklaerung', e.target.value)}
                  rows={4}
                  placeholder="Optionale zusätzliche Angaben zu Ihrem Widerruf."
                  className="w-full rounded-lg border border-[#E0DDDA] px-3.5 py-2.5 text-[#1B2A4A] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C8952E]/40 focus:border-[#C8952E] transition"
                />
              </div>
            </div>
            <button onClick={handleContinue} className="mt-7 w-full bg-[#1B2A4A] text-white font-medium py-3 rounded-lg hover:bg-[#16223b] transition">
              Weiter
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="bg-white rounded-xl border border-[#E0DDDA] p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-1">Bitte überprüfen Sie Ihre Angaben</h2>
            <p className="text-sm text-[#6B6560] mb-6">Mit dem Absenden widerrufen Sie verbindlich Ihren Vertrag.</p>
            <dl className="divide-y divide-[#E0DDDA] border-y border-[#E0DDDA]">
              <Row label="Name" value={data.name} />
              <Row label="E-Mail-Adresse" value={data.email} />
              <Row label="Bestellnummer" value={data.bestellnummer} />
              {data.widerrufserklaerung.trim() && <Row label="Widerrufserklärung" value={data.widerrufserklaerung} />}
            </dl>
            {submitError && (
              <p className="mt-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">{submitError}</p>
            )}
            <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={() => { setSubmitError(''); setStep('form') }} disabled={submitting} className="flex-1 border border-[#E0DDDA] text-[#1B2A4A] font-medium py-3 rounded-lg hover:bg-[#F5F4F0] transition disabled:opacity-50">
                Zurück
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#C8952E] text-white font-medium py-3 rounded-lg hover:bg-[#b3842a] transition disabled:opacity-60">
                {submitting ? 'Wird gesendet …' : 'Vertrag widerrufen'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-xl border border-[#E0DDDA] p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#1B2A4A] mb-2">Ihr Widerruf wurde übermittelt</h2>
            <p className="text-[#6B6560] leading-relaxed max-w-md mx-auto">
              Wir haben Ihren Widerruf erhalten. Eine Eingangsbestätigung wurde an{' '}
              <span className="font-medium text-[#1B2A4A]">{data.email}</span> gesendet. Über die weitere Bearbeitung informieren wir Sie gesondert.
            </p>
          </div>
        )}

        <p className="mt-6 text-xs text-[#6B6560] leading-relaxed text-center">
          Die Eingangsbestätigung bestätigt ausschließlich den Eingang Ihrer Erklärung, nicht deren rechtliche Wirksamkeit.
        </p>
      </main>

      <PublicFooter lang={lang} />
    </div>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition ${done ? 'bg-[#C8952E] text-white' : active ? 'bg-[#1B2A4A] text-white' : 'bg-[#EEECEA] text-[#6B6560]'}`}>
      {done ? '✓' : label}
    </div>
  )
}

function Field({ label, value, onChange, error, required, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
        {label}
        {required && <span className="text-[#C8952E]"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-[#1B2A4A] placeholder-[#A8A29E] focus:outline-none focus:ring-2 transition ${error ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : 'border-[#E0DDDA] focus:ring-[#C8952E]/40 focus:border-[#C8952E]'}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-sm font-medium text-[#6B6560] sm:w-44 shrink-0">{label}</dt>
      <dd className="text-sm text-[#1B2A4A] whitespace-pre-wrap break-words">{value}</dd>
    </div>
  )
}
