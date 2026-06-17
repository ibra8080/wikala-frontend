'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number
  sender: number
  content: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  id: number
  subject: string
  seller: number
  seller_name?: string
  related_product: number | null
  created_at: string
  messages: Message[]
}

interface IssueMessage {
  id: number
  sender: number
  content: string
  created_at: string
}

interface Issue {
  id: number
  issue_number: string
  seller: number
  seller_name?: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
  messages: IssueMessage[]
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const priorityStyles: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high:   'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
}

const statusStyles: Record<string, string> = {
  open:        'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved:    'bg-gray-100 text-gray-600 border-gray-200',
  closed:      'bg-gray-100 text-gray-500 border-gray-200',
}

const categoryLabels: Record<string, string> = {
  shipping: 'Shipping',
  payment:  'Payment',
  product:  'Product',
  other:    'Other',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unreadCount(conv: Conversation, adminId: number): number {
  return conv.messages?.filter(m => m.sender !== adminId && !m.is_read).length ?? 0
}

// ─── Component ────────────────────────────────────────────────────────────────

function AdminMessagesContent() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as 'conversations' | 'issues') ?? 'conversations'

  const [activeTab, setActiveTab]           = useState<'conversations' | 'issues'>(initialTab)
  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [issues, setIssues]                 = useState<Issue[]>([])
  const [loading, setLoading]               = useState(true)
  const [selectedConv, setSelectedConv]     = useState<Conversation | null>(null)
  const [selectedIssue, setSelectedIssue]   = useState<Issue | null>(null)
  const [newMessage, setNewMessage]         = useState('')
  const [sending, setSending]               = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [issueFilter, setIssueFilter]       = useState<string>('open')
  const selectedConvRef  = useRef<HTMLButtonElement | null>(null)
  const selectedIssueRef = useRef<HTMLButtonElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [convRes, issueRes] = await Promise.all([
        api.get('/communication/conversations/'),
        api.get('/communication/issues/'),
      ])
      setConversations(convRes.data)
      setIssues(issueRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    void fetchAll()
  }, [user, _hasHydrated, router, fetchAll])

  useEffect(() => {
    selectedConvRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedConv?.id])

  useEffect(() => {
    selectedIssueRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIssue?.id])

  useEffect(() => {
    wsRef.current?.close()
    wsRef.current = null
    if (!selectedConv) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const wsBase = apiUrl.replace(/\/api$/, '').replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsBase}/ws/chat/${selectedConv.id}/?token=${token}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as Message
      setSelectedConv(prev => prev ? { ...prev, messages: [...(prev.messages ?? []), data] } : prev)
    }
    wsRef.current = ws
    return () => { ws.close(); wsRef.current = null }
  }, [selectedConv?.id])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!newMessage.trim()) return
    if (selectedConv) {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ content: newMessage }))
        setNewMessage('')
        return
      }
      setSending(true)
      try {
        await api.post(`/communication/conversations/${selectedConv.id}/messages/`, { content: newMessage })
        const res = await api.get(`/communication/conversations/${selectedConv.id}/`)
        setSelectedConv(res.data)
        setNewMessage('')
        await fetchAll()
      } finally {
        setSending(false)
      }
    } else if (selectedIssue) {
      setSending(true)
      try {
        await api.post(`/communication/issues/${selectedIssue.id}/messages/`, { content: newMessage })
        const res = await api.get(`/communication/issues/${selectedIssue.id}/`)
        setSelectedIssue(res.data)
        setNewMessage('')
        await fetchAll()
      } finally {
        setSending(false)
      }
    }
  }

  const handleStatusChange = async (issue: Issue, newStatus: string) => {
    setStatusUpdating(true)
    try {
      await api.patch(`/communication/issues/${issue.id}/`, { status: newStatus })
      const res = await api.get(`/communication/issues/${issue.id}/`)
      setSelectedIssue(res.data)
      await fetchAll()
    } finally {
      setStatusUpdating(false)
    }
  }

  const selectConv = async (conv: Conversation) => {
    const res = await api.get(`/communication/conversations/${conv.id}/`)
    setSelectedConv(res.data)
    await api.post(`/communication/conversations/${conv.id}/read/`)
    await fetchAll()
  }

  const selectIssue = async (issue: Issue) => {
    const res = await api.get(`/communication/issues/${issue.id}/`)
    setSelectedIssue(res.data)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredIssues = issueFilter === 'all'
    ? issues
    : issues.filter(i => i.status === issueFilter)

  const issueTabs = ['open', 'in_progress', 'resolved', 'closed', 'all']

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Messages</h1>
        <p className="text-sm text-[#6B6560] mt-1">
          {conversations.length} conversations · {issues.length} support tickets
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-2 mb-6">
        {(['conversations', 'issues'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedConv(null); setSelectedIssue(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}
          >
            {tab === 'conversations' ? 'Conversations' : 'Support Tickets'}
            <span className="ml-2 text-xs opacity-70">
              {tab === 'conversations' ? conversations.length : issues.length}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════ CONVERSATIONS ══════════════ */}
      {activeTab === 'conversations' && (
        <div className="grid grid-cols-3 gap-4" style={{ height: '640px' }}>

          {/* List */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#E0DDDA] bg-[#F5F4F0]">
              <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                All Conversations
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#E0DDDA]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#6B6560]">No conversations yet.</div>
              ) : conversations.map(conv => {
                const unread = unreadCount(conv, user?.id ?? -1)
                return (
                  <button
                    key={conv.id}
                    ref={selectedConv?.id === conv.id ? selectedConvRef : null}
                    onClick={() => selectConv(conv)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F5F4F0] transition relative
                      ${selectedConv?.id === conv.id ? 'bg-[#EEECEA]' : ''}
                      ${unread > 0 && selectedConv?.id !== conv.id ? 'bg-[#FFF8EE]' : ''}`}
                  >
                    {unread > 0 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C8952E]" />
                    )}
                    {/* Seller badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#1B2A4A]/8 text-[#1B2A4A]">
                        {conv.seller_name ?? `Seller #${conv.seller}`}
                      </span>
                      {unread > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C8952E] text-white text-[10px] font-bold">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1B2A4A] truncate">{conv.subject}</p>
                    <p className="text-xs text-[#6B6560] mt-0.5">
                      {new Date(conv.created_at).toLocaleDateString('en-GB')}
                      {conv.messages?.length > 0 && (
                        <span className="ml-2 text-[#C8952E]">{conv.messages.length} msg</span>
                      )}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="col-span-2 bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-[#E0DDDA] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">{selectedConv.subject}</p>
                    <p className="text-xs text-[#6B6560] mt-0.5">
                      {selectedConv.seller_name ?? `Seller #${selectedConv.seller}`}
                      {selectedConv.related_product && (
                        <span className="ml-2 text-[#C8952E]">· Product #{selectedConv.related_product}</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-[#6B6560]">
                    {new Date(selectedConv.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedConv.messages?.length === 0 && (
                    <p className="text-center text-sm text-[#6B6560] mt-8">No messages yet.</p>
                  )}
                  {selectedConv.messages?.map(msg => {
                    const isAdmin = msg.sender === user?.id
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        {!isAdmin && (
                          <div className="w-6 h-6 rounded-full bg-[#1B2A4A]/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                            <span className="text-xs text-[#1B2A4A] font-medium">S</span>
                          </div>
                        )}
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm
                          ${isAdmin
                            ? 'bg-[#C8952E] text-white rounded-br-sm'
                            : 'bg-[#F5F4F0] text-[#1B2A4A] rounded-bl-sm'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isAdmin ? 'text-white/60' : 'text-[#6B6560]'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#E0DDDA] flex gap-2">
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Reply to seller..."
                    className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-[#6B6560]">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ ISSUES ══════════════ */}
      {activeTab === 'issues' && (
        <div>
          {/* Issue status filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {issueTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setIssueFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border
                  ${issueFilter === tab
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                    : 'bg-white text-[#6B6560] border-[#E0DDDA] hover:bg-[#F5F4F0]'}`}
              >
                {tab === 'in_progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1.5 opacity-70">
                  {tab === 'all' ? issues.length : issues.filter(i => i.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4" style={{ height: '580px' }}>

            {/* Issue list */}
            <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[#E0DDDA] bg-[#F5F4F0]">
                <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                  {filteredIssues.length} tickets
                </p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#E0DDDA]">
                {filteredIssues.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#6B6560]">No tickets found.</div>
                ) : filteredIssues.map(issue => (
                  <button
                    key={issue.id}
                    ref={selectedIssue?.id === issue.id ? selectedIssueRef : null}
                    onClick={() => selectIssue(issue)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F5F4F0] transition
                      ${selectedIssue?.id === issue.id ? 'bg-[#EEECEA]' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-[#6B6560]">{issue.issue_number}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border ${priorityStyles[issue.priority]}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1B2A4A] truncate">{issue.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border ${statusStyles[issue.status]}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#6B6560] truncate">
                        {issue.seller_name ?? `Seller #${issue.seller}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Issue detail */}
            <div className="col-span-2 bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
              {selectedIssue ? (
                <>
                  {/* Issue header */}
                  <div className="px-6 py-4 border-b border-[#E0DDDA]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-[#6B6560]">{selectedIssue.issue_number}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${priorityStyles[selectedIssue.priority]}`}>
                            {selectedIssue.priority}
                          </span>
                          <span className="text-xs text-[#6B6560] bg-[#F5F4F0] px-2 py-0.5 rounded">
                            {categoryLabels[selectedIssue.category]}
                          </span>
                        </div>
                        <p className="font-semibold text-[#1B2A4A]">{selectedIssue.title}</p>
                        <p className="text-xs text-[#6B6560] mt-0.5">
                          {selectedIssue.seller_name ?? `Seller #${selectedIssue.seller}`}
                          {' · '}
                          {new Date(selectedIssue.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>

                      {/* Status control — Admin only */}
                      <div className="flex-shrink-0">
                        <label className="block text-xs text-[#6B6560] mb-1">Status</label>
                        <select
                          value={selectedIssue.status}
                          onChange={e => handleStatusChange(selectedIssue, e.target.value)}
                          disabled={statusUpdating}
                          className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition disabled:opacity-50 cursor-pointer
                            ${statusStyles[selectedIssue.status]} border`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#6B6560] mt-3 bg-[#F5F4F0] rounded-lg px-4 py-3">
                      {selectedIssue.description}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedIssue.messages?.length === 0 && (
                      <p className="text-center text-sm text-[#6B6560] mt-8">No replies yet.</p>
                    )}
                    {selectedIssue.messages?.map(msg => {
                      const isAdmin = msg.sender === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          {!isAdmin && (
                            <div className="w-6 h-6 rounded-full bg-[#1B2A4A]/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                              <span className="text-xs text-[#1B2A4A] font-medium">S</span>
                            </div>
                          )}
                          <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm
                            ${isAdmin
                              ? 'bg-[#C8952E] text-white rounded-br-sm'
                              : 'bg-[#F5F4F0] text-[#1B2A4A] rounded-bl-sm'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isAdmin ? 'text-white/60' : 'text-[#6B6560]'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Input — disabled if closed */}
                  <div className="p-4 border-t border-[#E0DDDA]">
                    {selectedIssue.status === 'closed' ? (
                      <p className="text-center text-sm text-[#6B6560] py-1">This ticket is closed.</p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSend()}
                          placeholder="Reply to seller..."
                          className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"
                        />
                        <button
                          onClick={handleSend}
                          disabled={sending || !newMessage.trim()}
                          className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243860] disabled:opacity-50 transition"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-[#6B6560]">Select a ticket to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminMessagesContent />
    </Suspense>
  )
}