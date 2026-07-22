'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { overlayQR } from '@/lib/qr'
import HeartParticles from '@/components/HeartParticles'
import { TOKEN_COST, PACKAGES } from '@/lib/supabase-client'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('create')

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  const [msgPassword, setMsgPassword] = useState('')
  const [showMsgPw, setShowMsgPw] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaTitle, setMediaTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState('')
  const [buySuccess, setBuySuccess] = useState('')

  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('loveqr_token')
    const stored = localStorage.getItem('loveqr_user')
    if (!token || !stored) {
      router.push('/login')
      return
    }
    try {
      const u = JSON.parse(stored)
      setUser(u)
      fetchProfile(token)
    } catch {
      router.push('/login')
    }
  }, [router])

  const fetchProfile = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token || localStorage.getItem('loveqr_token')}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTokenBalance(data.tokens ?? 0)
      }
    } catch {} finally { setAuthLoading(false) }
  }

  const getToken = () => localStorage.getItem('loveqr_token')

  const handleLogout = () => {
    localStorage.removeItem('loveqr_token')
    localStorage.removeItem('loveqr_user')
    router.push('/')
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

  const handleCreate = async () => {
    if (!image || !message.trim() || !msgPassword.trim()) {
      setError('Please fill in all fields'); return
    }
    if (msgPassword.length < 4) {
      setError('Password must be at least 4 characters'); return
    }
    if (tokenBalance < TOKEN_COST) {
      setError(`You need ${TOKEN_COST} LoversCoin to create. Buy more coins first.`); return
    }
    setLoading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', image)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || 'Upload failed')
      const { url: imageUrl } = await uploadRes.json()

      const createRes = await fetch('/api/user/create-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          imageUrl, message: message.trim(), password: msgPassword.trim(),
          mediaUrl: mediaUrl.trim() || null, mediaTitle: mediaTitle.trim() || null,
          mediaType: mediaUrl.includes('drive.google.com') ? 'video' : null,
        }),
      })
      if (!createRes.ok) {
        const err = await createRes.json()
        if (createRes.status === 402) throw new Error('Not enough LoversCoins. Buy more coins.')
        throw new Error(err.error || 'Failed to create')
      }
      const data = await createRes.json()
      setTokenBalance(data.balance)

      const qrBlob = await overlayQR(image, data.viewUrl)
      const qrFd = new FormData(); qrFd.append('file', qrBlob, 'processed.jpg')
      const qrRes = await fetch('/api/upload', { method: 'POST', body: qrFd })
      if (!qrRes.ok) throw new Error('Failed to upload processed image')
      const { url: processedUrl } = await qrRes.json()
      setResult({ viewUrl: data.viewUrl, processedUrl, message: data.message })
      setStep('result')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const copyLink = () => { if (result) navigator.clipboard.writeText(result.viewUrl) }

  const handleBuyTokens = async (pkg) => {
    if (buyLoading) return
    setBuyLoading(true); setBuyError(''); setBuySuccess('')
    try {
      const res = await fetch('/api/user/buy-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Purchase failed')

      if (data.url) {
        window.location.href = data.url
      } else {
        setTokenBalance(data.balance)
        setBuySuccess(`Got ${data.tokens} LoversCoins! New balance: ${data.balance}`)
        fetchTransactions()
      }
    } catch (err) { setBuyError(err.message) } finally { setBuyLoading(false) }
  }

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true)
    try {
      const res = await fetch('/api/user/transactions', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) setTransactions(await res.json())
    } catch {} finally { setTxLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'history') fetchTransactions()
  }, [tab, fetchTransactions])

  useEffect(() => {
    fetchProfile()
  }, [])

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-heart flex items-center justify-center">
        <HeartParticles count={8} />
        <div className="w-12 h-12 rounded-full border-4 border-love-200 border-t-love-500 animate-spin" />
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
            <div>
              <h1 className="text-3xl font-heading text-gradient">LoveQR</h1>
              <p className="text-love-400 font-heading text-sm">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-love-100 text-love-700 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.15-.56-1.84-2.04-1.84-1.52 0-2.19.8-2.19 1.56 0 .87.52 1.27 2.58 1.84 2.14.59 4.27 1.5 4.27 3.87 0 1.61-1.17 2.99-3.51 3.32z"/></svg>
              {tokenBalance} coins
            </span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-love-500 hover:text-love-700 border border-love-200 rounded-xl hover:bg-love-50 transition-all text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white/60 rounded-2xl p-1 border border-love-200 shadow-sm">
          {['create', 'buy-coins', 'history'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                tab === t ? 'bg-gradient-btn text-white shadow-md' : 'text-love-500 hover:text-love-700 hover:bg-love-50'
              }`}
            >
              {t === 'create' && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
              {t === 'buy-coins' && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {t === 'history' && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {t === 'buy-coins' ? 'Buy Coins' : t.charAt(0).toUpperCase() + t.slice(1)}
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
                  Media (Optional)
                </h2>
                <div className="space-y-3">
                  <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Google Drive / YouTube / Spotify link..." className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" />
                  <input type="text" value={mediaTitle} onChange={(e) => setMediaTitle(e.target.value)} placeholder="Title (e.g. Our first dance)" className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300" />
                </div>
                <p className="text-xs text-love-300 mt-2">Attach a video, song, or link to your message</p>
              </div>
              <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading text-love-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Publish
                  </h2>
                  <span className="text-xs bg-love-100 text-love-600 px-2 py-1 rounded-full font-semibold">{TOKEN_COST} coin</span>
                </div>
                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
                <button onClick={handleCreate} disabled={loading}
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

        {tab === 'buy-coins' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8 text-center">
              <h2 className="text-2xl font-heading text-gradient mb-2">Get More LoversCoins</h2>
              <p className="text-love-400 text-sm mb-6">Each message costs {TOKEN_COST} LoversCoin. Stock up and keep the love going!</p>
              <div className="grid grid-cols-2 gap-4">
                {PACKAGES.map((pkg) => (
                  <button key={pkg.id} onClick={() => handleBuyTokens(pkg)} disabled={buyLoading}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-love-200 p-5 hover:border-love-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                  >
                    <p className="text-lg font-heading text-love-700 group-hover:text-gradient transition-all">{pkg.label}</p>
                    <p className="text-3xl font-bold text-love-600 my-1">{pkg.tokens}</p>
                    <p className="text-sm text-love-400">coins</p>
                    <div className="mt-3 pt-3 border-t border-love-100">
                      <span className="inline-block bg-gradient-btn text-white px-4 py-1.5 rounded-full text-sm font-semibold">${pkg.price}</span>
                    </div>
                  </button>
                ))}
              </div>
              {buyError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mt-4">{buyError}</div>}
              {buySuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl px-4 py-3 text-sm mt-4">{buySuccess}</div>}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8">
              <h2 className="text-xl font-heading text-love-700 mb-5">Transaction History</h2>
              {txLoading ? (
                <div className="text-center py-8 text-love-400"><svg className="w-8 h-8 mx-auto animate-spin mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-love-400">
                  <svg className="w-12 h-12 mx-auto text-love-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-love-500 font-medium">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3 border border-love-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'purchase' ? 'bg-green-100' : tx.type === 'spend' ? 'bg-love-100' : 'bg-amber-100'}`}>
                          {tx.type === 'purchase' ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : tx.type === 'spend' ? (
                            <svg className="w-4 h-4 text-love-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-love-800 font-medium">{tx.description}</p>
                          <p className="text-xs text-love-400">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-love-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
