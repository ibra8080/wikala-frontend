'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/axios'

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
  related_product: number | null
  created_at: string
  messages: Message[]
}

interface Issue {
  id: number
  issue_number: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  messages: IssueMessage[]
}

interface IssueMessage {
  id: number
  sender: number
  content: string
  created_at: string
}

const priorityStyles: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
}

const statusStyles: Record<string, string> = {
  open: 'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-gray-100 text-gray-600',
  closed: 'bg-gray-100 text-gray-500',
}

function unreadCount(conv: Conversation, sellerId: number): number {
  return conv.messages?.filter(m => m.sender !== sellerId && !m.is_read).length ?? 0
}

function MessagesContent() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'conversations' | 'issues'>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [showNewIssue, setShowNewIssue] = useState(false)
  const [newConvSubject, setNewConvSubject] = useState('')
  const [newConvMessage, setNewConvMessage] = useState('')
  const [newIssue, setNewIssue] = useState({
    title: '', description: '', category: 'other', priority: 'medium'
  })
  const selectedConvRef  = useRef<HTMLButtonElement | null>(null)
  const selectedIssueRef = useRef<HTMLButtonElement | null>(null)

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

  const selectConv = useCallback(async (conv: Conversation) => {
    const res = await api.get(`/communication/conversations/${conv.id}/`)
    setSelectedConv(res.data)
    await api.post(`/communication/conversations/${conv.id}/read/`)
    await fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    void fetchAll()
  }, [user, _hasHydrated, router, fetchAll])

  useEffect(() => {
    const tab = searchParams.get('tab') as 'conversations' | 'issues' | null
    const isNew = searchParams.get('new')
    const title = searchParams.get('title')
    const description = searchParams.get('description')

    if (tab) setActiveTab(tab)
    if (isNew === 'true') {
      setShowNewIssue(true)
      if (title) setNewIssue(p => ({ ...p, title, category: 'shipping' }))
      if (description) setNewIssue(p => ({ ...p, description: decodeURIComponent(description) }))
    }
  }, [searchParams])

  useEffect(() => {
    selectedConvRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedConv?.id])

  useEffect(() => {
    selectedIssueRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIssue?.id])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      if (selectedConv) {
        await api.post(`/communication/conversations/${selectedConv.id}/messages/`, {
          content: newMessage
        })
        const res = await api.get(`/communication/conversations/${selectedConv.id}/`)
        setSelectedConv(res.data)
        await fetchAll()
      } else if (selectedIssue) {
        await api.post(`/communication/issues/${selectedIssue.id}/messages/`, {
          content: newMessage
        })
        const res = await api.get(`/communication/issues/${selectedIssue.id}/`)
        setSelectedIssue(res.data)
        await fetchAll()
      }
      setNewMessage('')
    } finally {
      setSending(false)
    }
  }

  const handleCreateConversation = async () => {
    if (!newConvSubject.trim() || !newConvMessage.trim()) return
    setSending(true)
    try {
      const res = await api.post('/communication/conversations/', {
        subject: newConvSubject
      })
      await api.post(`/communication/conversations/${res.data.id}/messages/`, {
        content: newConvMessage
      })
      setShowNewConv(false)
      setNewConvSubject('')
      setNewConvMessage('')
      await fetchAll()
      setSelectedConv(res.data)
    } finally {
      setSending(false)
    }
  }

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !newIssue.description.trim()) return
    setSending(true)
    try {
      const res = await api.post('/communication/issues/', newIssue)
      setShowNewIssue(false)
      setNewIssue({ title: '', description: '', category: 'other', priority: 'medium' })
      await fetchAll()
      setSelectedIssue(res.data)
    } finally {
      setSending(false)
    }
  }

  const inputClass = "w-full border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A] transition"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Messages</h1>
        <p className="text-sm text-[#6B6560] mt-1">Communicate with Wikala team</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('conversations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${activeTab === 'conversations' ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
          Messages
          <span className="ml-2 text-xs opacity-70">{conversations.length}</span>
        </button>
        <button onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${activeTab === 'issues' ? 'bg-[#1B2A4A] text-white' : 'bg-[#F5F4F0] text-[#6B6560] hover:bg-[#EEECEA]'}`}>
          Support Tickets
          <span className="ml-2 text-xs opacity-70">{issues.length}</span>
        </button>
      </div>

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="grid grid-cols-3 gap-4" style={{ height: '600px' }}>
          {/* List */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E0DDDA] flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1B2A4A]">Conversations</p>
              <button onClick={() => setShowNewConv(true)}
                className="text-xs text-[#C8952E] hover:underline">+ New</button>
            </div>

            {showNewConv && (
              <div className="p-4 border-b border-[#E0DDDA] bg-[#F5F4F0]">
                <input value={newConvSubject} onChange={e => setNewConvSubject(e.target.value)}
                  placeholder="Subject (short title)..." className={inputClass + ' mb-2'} />
                <textarea value={newConvMessage} onChange={e => setNewConvMessage(e.target.value)}
                  placeholder="Your message..." rows={3} className={inputClass + ' mb-2 resize-none'} />
                <div className="flex gap-2">
                  <button onClick={handleCreateConversation} disabled={sending || !newConvSubject.trim() || !newConvMessage.trim()}
                    className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
                    Send
                  </button>
                  <button onClick={() => { setShowNewConv(false); setNewConvSubject(''); setNewConvMessage('') }}
                    className="text-xs text-[#6B6560]">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#6B6560]">No conversations yet</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const unread = unreadCount(conv, user?.id ?? -1)
                  return (
                    <button
                      key={conv.id}
                      ref={selectedConv?.id === conv.id ? selectedConvRef : null}
                      onClick={() => selectConv(conv)}
                      className={`w-full text-left px-4 py-3 border-b border-[#E0DDDA] hover:bg-[#F5F4F0] transition relative
                        ${selectedConv?.id === conv.id ? 'bg-[#EEECEA]' : ''}
                        ${unread > 0 && selectedConv?.id !== conv.id ? 'bg-[#FFF8EE]' : ''}`}>
                      <p className="text-sm font-medium text-[#1B2A4A] truncate">{conv.subject}</p>
                      <p className="text-xs text-[#6B6560] mt-0.5">
                        {new Date(conv.created_at).toLocaleDateString('en-GB')}
                      </p>
                      {unread > 0 && (
                        <span className="absolute right-3 top-3 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C8952E] text-white text-[10px] font-bold">
                          {unread}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="col-span-2 bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                <div className="p-4 border-b border-[#E0DDDA]">
                  <p className="font-semibold text-[#1B2A4A]">{selectedConv.subject}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedConv.messages?.length === 0 && (
                    <p className="text-center text-sm text-[#6B6560] mt-8">No messages yet. Start the conversation.</p>
                  )}
                  {selectedConv.messages?.map(msg => (
                    <div key={msg.id}
                      className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm
                        ${msg.sender === user?.id
                          ? 'bg-[#1B2A4A] text-white rounded-br-sm'
                          : 'bg-[#F5F4F0] text-[#1B2A4A] rounded-bl-sm'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender === user?.id ? 'text-white/60' : 'text-[#6B6560]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-[#E0DDDA] flex gap-2">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A]" />
                  <button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}
                    className="bg-[#C8952E] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-[#6B6560]">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="grid grid-cols-3 gap-4" style={{ height: '600px' }}>
          {/* List */}
          <div className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E0DDDA] flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1B2A4A]">Support Tickets</p>
              <button onClick={() => setShowNewIssue(true)}
                className="text-xs text-[#C8952E] hover:underline">+ New</button>
            </div>

            {showNewIssue && (
              <div className="p-4 border-b border-[#E0DDDA] bg-[#F5F4F0] space-y-2">
                <input value={newIssue.title} onChange={e => setNewIssue(p => ({ ...p, title: e.target.value }))}
                  placeholder="Title..." className={inputClass} />
                <textarea value={newIssue.description}
                  onChange={e => setNewIssue(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description..." rows={3} className={inputClass + ' resize-none'} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newIssue.category}
                    onChange={e => setNewIssue(p => ({ ...p, category: e.target.value }))}
                    className={inputClass}>
                    <option value="shipping">Shipping</option>
                    <option value="payment">Payment</option>
                    <option value="product">Product</option>
                    <option value="other">Other</option>
                  </select>
                  <select value={newIssue.priority}
                    onChange={e => setNewIssue(p => ({ ...p, priority: e.target.value }))}
                    className={inputClass}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateIssue} disabled={sending}
                    className="bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
                    Submit
                  </button>
                  <button onClick={() => setShowNewIssue(false)}
                    className="text-xs text-[#6B6560]">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {issues.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#6B6560]">No tickets yet</p>
                </div>
              ) : (
                issues.map(issue => (
                  <button
                      key={issue.id}
                      ref={selectedIssue?.id === issue.id ? selectedIssueRef : null}
                      onClick={() => setSelectedIssue(issue)}
                    className={`w-full text-left px-4 py-3 border-b border-[#E0DDDA] hover:bg-[#F5F4F0] transition
                      ${selectedIssue?.id === issue.id ? 'bg-[#EEECEA]' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-mono text-[#6B6560]">{issue.issue_number}</p>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border ${priorityStyles[issue.priority]}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1B2A4A] truncate">{issue.title}</p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border mt-1 ${statusStyles[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Issue Detail */}
          <div className="col-span-2 bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden flex flex-col">
            {selectedIssue ? (
              <>
                <div className="p-4 border-b border-[#E0DDDA]">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-mono text-xs text-[#6B6560]">{selectedIssue.issue_number}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[selectedIssue.status]}`}>
                      {selectedIssue.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${priorityStyles[selectedIssue.priority]}`}>
                      {selectedIssue.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-[#1B2A4A]">{selectedIssue.title}</p>
                  <p className="text-sm text-[#6B6560] mt-1">{selectedIssue.description}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedIssue.messages?.length === 0 && (
                    <p className="text-center text-sm text-[#6B6560] mt-8">No replies yet.</p>
                  )}
                  {selectedIssue.messages?.map(msg => (
                    <div key={msg.id}
                      className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm
                        ${msg.sender === user?.id
                          ? 'bg-[#1B2A4A] text-white rounded-br-sm'
                          : 'bg-[#F5F4F0] text-[#1B2A4A] rounded-bl-sm'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender === user?.id ? 'text-white/60' : 'text-[#6B6560]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-[#E0DDDA] flex gap-2">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Reply..."
                    className="flex-1 border border-[#E0DDDA] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B2A4A]" />
                  <button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}
                    className="bg-[#C8952E] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] disabled:opacity-50 transition">
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-[#6B6560]">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-[#C8952E] border-t-transparent rounded-full animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  )
}