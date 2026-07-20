'use client'

import { useState, useRef, useCallback } from 'react'
import { overlayQR } from '@/lib/qr'
import HeartParticles from '@/components/HeartParticles'

export default function CreatePage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

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
    if (!image || !message.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters')
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
          password: password.trim(),
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

            <button
              onClick={() => {
                setStep('form')
                setImage(null)
                setPreview(null)
                setMessage('')
                setPassword('')
                setResult(null)
              }}
              className="mt-6 text-love-400 hover:text-love-600 text-sm transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-heart">
      <HeartParticles count={10} />

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-5xl font-heading text-gradient mb-2">LoveQR</h1>
          <p className="text-love-500 text-lg font-heading">Hide your heart in a QR code</p>
        </div>

        <div className="bg-gradient-card backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8 space-y-6 animate-slide-up">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-love-800 mb-2">Choose Your Photo</label>
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
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
                    <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <svg className="w-12 h-12 mx-auto text-love-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

          <div>
            <label className="block text-sm font-semibold text-love-800 mb-2">
              Your Secret Message
              <span className="text-love-300 font-normal ml-1">({message.length}/5000)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write something from the heart..."
              rows={5}
              maxLength={5000}
              className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all resize-none text-love-900 placeholder:text-love-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-love-800 mb-2">Set a Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your secret password..."
              className="w-full px-4 py-3 rounded-xl border-2 border-love-200 bg-white/80 focus:border-love-400 focus:ring-2 focus:ring-love-200 outline-none transition-all text-love-900 placeholder:text-love-300"
            />
            <p className="text-xs text-love-300 mt-1">Share this password with your recipient</p>
          </div>

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
                Creating your LoveQR...
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

        <div className="text-center mt-8 text-love-300 text-xs animate-fade-in">
          <p>Your message is encrypted and password-protected</p>
        </div>
      </div>
    </main>
  )
}
