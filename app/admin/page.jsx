'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { overlayQR } from '@/lib/qr'
import HeartParticles from '@/components/HeartParticles'

const ADMIN_PASSWORD = 'loveqr123'

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [tab, setTab] = useState('create')

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  const [msgPassword, setMsgPassword] = useState('')
  const [showMsgPw, setShowMsgPw] = useState(false)
  const [songUrl, setSongUrl] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editMsg, setEditMsg] = useState('')
  const [editPw, setEditPw] = useState('')
  const [editSongUrl, setEditSongUrl] = useState('')
  const [editSongTitle, setEditSongTitle] = useState('')
  const [editShowPw, setEditShowPw] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editTokens, setEditTokens] = useState('')
  const [editUserSaving, setEditUserSaving] = useState(false)
  const [editUserError, setEditUserError] = useState('')
  const [editUserSuccess, setEditUserSuccess] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('loveqr_admin') === 'true') {
      setLoggedIn(true)
    }
  }, [])

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('loveqr_admin', 'true')
      setLoggedIn(true)
      setPwError('')
    } else {
      setPwError('Invalid admin password')
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file); setPreview(URL.createObjectURL(file)); setError('')
    }
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); setError('') }
  }

  const handleSubmit = async () => {
    if (!image || !message.trim() || !msgPassword.trim()) {
      setError('Please fill in all fields'); return
    }
    if (msgPassword.length < 4) {
      setError('Password must be at least 4 characters'); return
    }
    setLoading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', image)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || 'Upload failed')
      const { url: imageUrl } = await uploadRes.json()

      const createRes = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl, message: message.trim(), password: msgPassword.trim(),
          songUrl: songUrl.trim() || null, songTitle: songTitle.trim() || null,
        }),
      })
      if (!createRes.ok) throw new Error((await createRes.json()).error || 'Failed to create')
      const data = await createRes.json()
      const qrBlob = await overlayQR(image, data.viewUrl)
      const qrFd = new FormData(); qrFd.append('file', qrBlob, 'processed.jpg')
      const qrRes = await fetch('/api/upload', { method: 'POST', body: qrFd })
      if (!qrRes.ok) throw new Error('Failed to upload processed image')
      const { url: processedUrl } = await qrRes.json()
      setResult({ viewUrl: data.viewUrl, processedUrl, message: data.message })
      setStep('result')
    } catch (err) { setError(err.message || 'Something went wrong') }
    finally { setLoading(false) }
  }

  const copyLink = () => { if (result) navigator.clipboard.writeText(result.viewUrl) }

  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true)
    try {
      const res = await fetch('/api/admin/messages', { headers: { 'x-admin-password': ADMIN_PASSWORD } })
      if (res.ok) setMessages(await res.json())
    } catch {} finally { setMessagesLoading(false) }
  }, [])

  const handleEdit = (msg) => {
    setEditingMessage(msg); setEditMsg(msg.message || ''); setEditPw('')
    setEditSongUrl(msg.song_url || ''); setEditSongTitle(msg.song_title || '')
    setEditError(''); setEditSuccess('')
  }

  const handleSaveEdit = async () => {
    if (!editMsg.trim()) { setEditError('Message cannot be empty'); return }
    if (editPw && editPw.length < 4) { setEditError('Password must be at least 4 characters'); return }
    setEditSaving(true); setEditError(''); setEditSuccess('')
    try {
      const body = { message: editMsg.trim() }
      if (editPw.trim()) body.password = editPw.trim()
      body.songUrl = editSongUrl.trim() || null; body.songTitle = editSongTitle.trim() || null
      const res = await fetch(`/api/admin/messages/${editingMessage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
      setEditSuccess('Message updated!'); fetchMessages()
      setTimeout(() => { setEditingMessage(null); setEditSuccess('') }, 1200)
    } catch (err) { setEditError(err.message) } finally { setEditSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE', headers: { 'x-admin-password': ADMIN_PASSWORD } })
      if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch {} finally { setDeletingId(null) }
  }

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': ADMIN_PASSWORD } })
      if (res.ok) setUsers(await res.json())
    } catch {} finally { setUsersLoading(false) }
  }, [])

  const handleEditUser = (u) => {
    setEditingUser(u); setEditTokens(String(u.tokens ?? 0)); setEditUserError(''); setEditUserSuccess('')
  }

  const handleSaveUser = async () => {
    const tokens = parseInt(editTokens)
    if (isNaN(tokens) || tokens < 0) { setEditUserError('Invalid token amount'); return }
    setEditUserSaving(true); setEditUserError(''); setEditUserSuccess('')
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({ tokens }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
      setEditUserSuccess('Tokens updated!'); fetchUsers()
      setTimeout(() => { setEditingUser(null); setEditUserSuccess('') }, 1200)
    } catch (err) { setEditUserError(err.message) } finally { setEditUserSaving(false) }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('loveqr_admin'); setLoggedIn(false); setPasswordInput('')
    setStep('form'); setTab('create'); setImage(null); setPreview(null); setMessage('')
    setMsgPassword(''); setSongUrl(''); setSongTitle(''); setResult(null)
  }

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-gradient-heart flex items-center justify-center p-4">
        <HeartParticles count={10} />
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="LoveQR" className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-4xl font-heading text-gradient mb-1">LoveQR</h1>
            <p className="text-love-400 font-heading text-lg">Admin Panel</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-btn mx-auto mb-5 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-heading text-love-700 text-center mb-2">Admin Access Required</h2>
            <p className="text-love-400 text-sm text-center mb-6">Enter the admin password</p>
            {pwError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{pwError}</div>}
            <div className="space-y-4">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setPwError('') }} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="Enter admin password..." className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" autoFocus />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-love-400 hover:text-love-600 p-1" tabIndex={-1}>
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              <button onClick={handleLogin} className="w-full py-3 px-6 bg-gradient-btn text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 active:scale-[0.98]">Access Panel</button>
            </div>
          </div>
          <div className="text-center mt-4"><a href="/" className="text-xs text-love-300 hover:text-love-400">Back to home</a></div>
        </div>
      </main>
    )
  }

  if (step === 'result' && result) {
    return (
      <main className="min-h-screen bg-gradient-heart flex items-center justify-center p-4">
        <HeartParticles count={15} />
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-btn mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <h1 className="text-3xl font-heading text-gradient mb-2">Your LoveQR is Ready!</h1>
            <p className="text-love-600/70 mb-6">Share this with your special someone</p>
            <div className="rounded-2xl overflow-hidden border-2 border-love-200 shadow-md mb-6 max-h-96">
              <img src={result.processedUrl} alt="Love message with QR code" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-3">
              <button onClick={copyLink} className="w-full py-3 px-6 bg-gradient-btn text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">Copy Secret Link</button>
              <a href={result.viewUrl} target="_blank" rel="noopener noreferrer" className="block w-full py-3 px-6 bg-white text-love-600 rounded-xl font-semibold border-2 border-love-200 hover:bg-love-50 transition-all">Preview Message</a>
              <a href={result.processedUrl} download="loveqr.jpg" className="block w-full py-2.5 px-6 text-love-500 rounded-xl font-medium hover:text-love-700 transition-colors text-sm">Download Image</a>
            </div>
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={() => { setStep('form'); setImage(null); setPreview(null); setMessage(''); setMsgPassword(''); setResult(null) }} className="text-love-400 hover:text-love-600 text-sm transition-colors">Create Another</button>
              <span className="text-love-200">|</span>
              <button onClick={handleLogout} className="text-love-400 hover:text-love-600 text-sm transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-heart">
      <HeartParticles count={10} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LoveQR" className="w-10 h-10" />
            <div><h1 className="text-3xl font-heading text-gradient">LoveQR</h1><p className="text-love-400 font-heading text-sm">Admin Dashboard</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-love-500 hover:text-love-700 border border-love-200 rounded-xl hover:bg-love-50 transition-all text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            Logout
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white/60 rounded-2xl p-1 border border-love-200 shadow-sm">
          {['create', 'manage', 'users'].map((t) => (
            <button key={t} onClick={() => { setTab(t); if (t === 'manage') fetchMessages(); if (t === 'users') fetchUsers() }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 capitalize ${
                tab === t ? 'bg-gradient-btn text-white shadow-md' : 'text-love-500 hover:text-love-700 hover:bg-love-50'
              }`}
            >
              {t === 'create' && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
              {t === 'manage' && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
              {t === 'users' && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
              {t}
            </button>
          ))}
        </div>

        {tab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8">
                <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" /></svg>
                  Upload Image
                </h2>
                <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
                    preview ? 'border-love-300 bg-love-50/50' : 'border-love-200 hover:border-love-400 bg-white/50 hover:bg-love-50/30'
                  }`}
                >
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="Preview" className="max-h-72 mx-auto rounded-xl object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
                        <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10">
                      <svg className="w-14 h-14 mx-auto text-love-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      <p className="text-love-500 font-medium">Drop a photo here or click to browse</p>
                      <p className="text-love-300 text-sm mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              </div>
              <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8">
                <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  Secret Message
                </h2>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write something from the heart..." rows={5} maxLength={5000} className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all resize-none text-love-900 placeholder:text-love-300" />
                <div className="flex justify-between mt-2"><p className="text-xs text-love-300">Write your love message here</p><span className="text-xs text-love-300">{message.length}/5000</span></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6">
                <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                  Recipient Password
                </h2>
                <div className="relative">
                  <input type={showMsgPw ? 'text' : 'password'} value={msgPassword} onChange={(e) => setMsgPassword(e.target.value)} placeholder="Set a password for recipient..." className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" />
                  <button type="button" onClick={() => setShowMsgPw(!showMsgPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-love-400 hover:text-love-600 p-1" tabIndex={-1}>
                    {showMsgPw ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-love-300 mt-2">Share this password with your recipient</p>
              </div>
              <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6">
                <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553l-10.5 3M9 9l10.5-3M9 9l3.75 3.75M9 9l-3.75 3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Song (Optional)
                </h2>
                <div className="space-y-3">
                  <input type="url" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} placeholder="Spotify / YouTube / Apple Music link..." className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" />
                  <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Song title (e.g. Perfect - Ed Sheeran)" className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" />
                </div>
                <p className="text-xs text-love-300 mt-2">Paste a link to your special song</p>
              </div>
              <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6">
                <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Publish
                </h2>
                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-btn text-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Create LoveQR</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'manage' && (
          <div className="space-y-4">
            {messagesLoading ? (
              <div className="text-center py-12 text-love-400"><svg className="w-8 h-8 mx-auto animate-spin mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-love-200 p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-love-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V3" /></svg>
                <p className="text-love-500 font-medium">No messages yet</p>
              </div>
            ) : messages.map((msg) => (
              <div key={msg.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-love-200 p-5 flex items-start gap-4 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-love-50 border border-love-100">
                  <img src={msg.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-love-800 font-medium truncate">{msg.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-love-400">
                    <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    {msg.song_title && <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>{msg.song_title}</span>}
                    <span>{msg.view_count} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={`/m/${msg.id}`} target="_blank" rel="noopener noreferrer" className="p-2 text-love-400 hover:text-love-600 hover:bg-love-50 rounded-lg transition-colors" title="Preview">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </a>
                  <button onClick={() => handleEdit(msg)} className="p-2 text-love-400 hover:text-love-600 hover:bg-love-50 rounded-lg transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                  </button>
                  <button onClick={() => handleDelete(msg.id)} disabled={deletingId === msg.id} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Delete">
                    {deletingId === msg.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            {usersLoading ? (
              <div className="text-center py-12 text-love-400"><svg className="w-8 h-8 mx-auto animate-spin mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Loading users...</div>
            ) : users.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-love-200 p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-love-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                <p className="text-love-500 font-medium">No users yet</p>
              </div>
            ) : users.map((u) => (
              <div key={u.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-love-200 p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-full bg-gradient-btn flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-love-800 font-medium truncate">{u.email}</p>
                  <p className="text-xs text-love-400">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-love-100 text-love-700 px-3 py-1 rounded-full text-sm font-semibold">{u.tokens ?? 0} coins</span>
                  <button onClick={() => handleEditUser(u)} className="text-love-400 hover:text-love-600 hover:bg-love-50 p-2 rounded-lg transition-colors" title="Adjust tokens">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !editSaving && setEditingMessage(null)}>
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-love-200 p-6 sm:p-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-love-700">Edit Message</h2>
              <button onClick={() => setEditingMessage(null)} className="p-1 text-love-400 hover:text-love-600 rounded-lg hover:bg-love-50 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-love-800 mb-1.5">Message</label><textarea value={editMsg} onChange={(e) => setEditMsg(e.target.value)} rows={5} maxLength={5000} className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all resize-none text-love-900" /></div>
              <div><label className="block text-sm font-semibold text-love-800 mb-1.5">New Password <span className="text-love-300 font-normal">(leave blank to keep current)</span></label><div className="relative">
                <input type={editShowPw ? 'text' : 'password'} value={editPw} onChange={(e) => setEditPw(e.target.value)} placeholder="Enter new password..." className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" />
                <button type="button" onClick={() => setEditShowPw(!editShowPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-love-400 hover:text-love-600 p-1" tabIndex={-1}>
                  {editShowPw ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                </button>
              </div></div>
              <div><label className="block text-sm font-semibold text-love-800 mb-1.5">Song Link <span className="text-love-300 font-normal">(optional)</span></label><input type="url" value={editSongUrl} onChange={(e) => setEditSongUrl(e.target.value)} placeholder="Spotify / YouTube / Apple Music..." className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" /></div>
              <div><label className="block text-sm font-semibold text-love-800 mb-1.5">Song Title</label><input type="text" value={editSongTitle} onChange={(e) => setEditSongTitle(e.target.value)} placeholder="e.g. Perfect - Ed Sheeran" className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" /></div>
              {editError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{editError}</div>}
              {editSuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl px-4 py-3 text-sm">{editSuccess}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingMessage(null)} className="flex-1 py-3 px-4 rounded-xl border-2 border-love-200 text-love-600 font-semibold hover:bg-love-50 transition-all">Cancel</button>
                <button onClick={handleSaveEdit} disabled={editSaving} className="flex-1 py-3 px-4 bg-gradient-btn text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{editSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !editUserSaving && setEditingUser(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-love-200 p-6 sm:p-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-love-700">Adjust Tokens</h2>
              <button onClick={() => setEditingUser(null)} className="p-1 text-love-400 hover:text-love-600 rounded-lg hover:bg-love-50 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-love-600 mb-4 truncate">{editingUser.email}</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-love-800 mb-1.5">Token Balance</label><input type="number" min="0" value={editTokens} onChange={(e) => { setEditTokens(e.target.value); setEditUserError('') }} className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900" /></div>
              {editUserError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{editUserError}</div>}
              {editUserSuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl px-4 py-3 text-sm">{editUserSuccess}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-3 px-4 rounded-xl border-2 border-love-200 text-love-600 font-semibold hover:bg-love-50 transition-all">Cancel</button>
                <button onClick={handleSaveUser} disabled={editUserSaving} className="flex-1 py-3 px-4 bg-gradient-btn text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{editUserSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
