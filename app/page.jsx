'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { overlayQR } from '@/lib/qr'
import HeartParticles from '@/components/HeartParticles'

const ADMIN_PASSWORD = 'loveqr123'

export default function CreatePage() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  const [messagePassword, setMessagePassword] = useState('')
  const [showMessagePassword, setShowMessagePassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (sessionStorage.getItem('loveqr_admin') === 'true') {
      setAdminLoggedIn(true)
    }
  }, [])

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem('loveqr_admin', 'true')
      setAdminLoggedIn(true)
      setAdminError('')
    } else {
      setAdminError('Invalid admin password')
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!image || !message.trim() || !messagePassword.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (messagePassword.length < 4) {
      setError('Message password must be at least 4 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', image)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }

      const { url: imageUrl } = await uploadRes.json()

      const createRes = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          message: message.trim(),
          password: messagePassword.trim(),
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error || 'Failed to create message')
      }

      const data = await createRes.json()

      const qrBlob = await overlayQR(image, data.viewUrl)

      const qrFormData = new FormData()
      qrFormData.append('file', qrBlob, 'processed.jpg')

      const qrUploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: qrFormData,
      })

      if (!qrUploadRes.ok) {
        throw new Error('Failed to upload processed image')
      }

      const { url: processedUrl } = await qrUploadRes.json()

      setResult({
        viewUrl: data.viewUrl,
        processedUrl,
        message: data.message,
      })
      setStep('result')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (result) {
      navigator.clipboard.writeText(result.viewUrl)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('loveqr_admin')
    setAdminLoggedIn(false)
    setAdminPassword('')
    setStep('form')
    setImage(null)
    setPreview(null)
    setMessage('')
    setMessagePassword('')
    setResult(null)
  }

  if (!adminLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-heart flex items-center justify-center p-4">
        <HeartParticles count={10} />
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
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
            <p className="text-love-400 text-sm text-center mb-6">Enter the admin password to create messages</p>

            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
                {adminError}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value)
                    setAdminError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="Enter admin password..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-love-400 hover:text-love-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showAdminPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleAdminLogin}
                className="w-full py-3 px-6 bg-gradient-btn text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
              >
                Access Panel
              </button>
            </div>
          </div>
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
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <h1 className="text-3xl font-heading text-gradient mb-2">Your LoveQR is Ready!</h1>
            <p className="text-love-600/70 mb-6">Share this with your special someone</p>

            <div className="rounded-2xl overflow-hidden border-2 border-love-200 shadow-md mb-6 max-h-96">
              <img
                src={result.processedUrl}
                alt="Your love message with QR code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="w-full py-3 px-6 bg-gradient-btn text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Copy Secret Link
              </button>

              <a
                href={result.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 bg-white text-love-600 rounded-xl font-semibold border-2 border-love-200 hover:bg-love-50 transition-all duration-200"
              >
                Preview Message
              </a>

              <a
                href={result.processedUrl}
                download="loveqr.jpg"
                className="block w-full py-2.5 px-6 text-love-500 rounded-xl font-medium hover:text-love-700 transition-colors duration-200 text-sm"
              >
                Download Image
              </a>
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={() => {
                  setStep('form')
                  setImage(null)
                  setPreview(null)
                  setMessage('')
                  setMessagePassword('')
                  setResult(null)
                }}
                className="text-love-400 hover:text-love-600 text-sm transition-colors"
              >
                Create Another
              </button>
              <span className="text-love-200">|</span>
              <button
                onClick={handleLogout}
                className="text-love-400 hover:text-love-600 text-sm transition-colors"
              >
                Logout
              </button>
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
          <div>
            <h1 className="text-4xl font-heading text-gradient">LoveQR</h1>
            <p className="text-love-400 font-heading text-base">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-love-500 hover:text-love-700 border border-love-200 rounded-xl hover:bg-love-50 transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8">
              <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                </svg>
                Upload Image
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
                  preview
                    ? 'border-love-300 bg-love-50/50'
                    : 'border-love-200 hover:border-love-400 bg-white/50 hover:bg-love-50/30'
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
                    <svg className="w-14 h-14 mx-auto text-love-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-love-500 font-medium">Drop a photo here or click to browse</p>
                    <p className="text-love-300 text-sm mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8">
              <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Secret Message
              </h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something from the heart..."
                rows={5}
                maxLength={5000}
                className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all resize-none text-love-900 placeholder:text-love-300"
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-love-300">Write your love message here</p>
                <span className="text-xs text-love-300">{message.length}/5000</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6">
              <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Recipient Password
              </h2>
              <div className="relative">
                <input
                  type={showMessagePassword ? 'text' : 'password'}
                  value={messagePassword}
                  onChange={(e) => setMessagePassword(e.target.value)}
                  placeholder="Set a password for recipient..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300"
                />
                <button
                  type="button"
                  onClick={() => setShowMessagePassword(!showMessagePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-love-400 hover:text-love-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showMessagePassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-love-300 mt-2">Share this password with your recipient</p>
            </div>

            <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6">
              <h2 className="text-xl font-heading text-love-700 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Publish
              </h2>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-btn text-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Create LoveQR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
