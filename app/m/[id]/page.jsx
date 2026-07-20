'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import HeartParticles from '@/components/HeartParticles'

export default function ViewMessagePage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [data, setData] = useState(null)
  const [messageData, setMessageData] = useState(null)
  const [wrongPassword, setWrongPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetch(`/api/messages/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
        }
      })
      .catch(() => setError('Failed to load message'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = useCallback(async () => {
    if (!password.trim()) return

    setWrongPassword(false)
    setLoading(true)

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })

      const d = await res.json()

      if (!res.ok) {
        setWrongPassword(true)
        setError(d.error || 'Incorrect password')
        return
      }

      setMessageData(d)
      setRevealed(true)
      setError('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [id, password])

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-gradient-heart flex items-center justify-center">
        <HeartParticles count={8} />
        <div className="text-love-400 animate-pulse-soft">
          <svg className="w-12 h-12 mx-auto animate-heartbeat" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </main>
    )
  }

  if (error && !messageData) {
    return (
      <main className="min-h-screen bg-gradient-heart flex items-center justify-center p-4">
        <HeartParticles count={8} />
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center max-w-md shadow-xl border border-love-200">
          <div className="w-16 h-16 rounded-full bg-love-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-love-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-heading text-love-700 mb-2">Oh no!</h2>
          <p className="text-love-500">{error}</p>
        </div>
      </main>
    )
  }

  if (revealed && messageData) {
    const lines = messageData.message.split('\n')

    return (
      <main className="min-h-screen bg-gradient-heart overflow-hidden relative">
        <HeartParticles count={20} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-love-200/30 text-6xl font-heading animate-float">&#10084;</div>
          <div className="absolute top-20 right-20 text-love-300/20 text-4xl font-heading animate-float" style={{ animationDelay: '1s' }}>&#10084;</div>
          <div className="absolute bottom-20 left-1/4 text-love-200/20 text-5xl font-heading animate-float" style={{ animationDelay: '2s' }}>&#10084;</div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-btn shadow-lg mb-4">
                <svg className="w-7 h-7 text-white animate-heartbeat" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <h1 className="text-4xl font-heading text-gradient mb-1">A message for you</h1>
              <p className="text-love-400 text-sm font-heading">Someone wants you to read this</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-love-200 overflow-hidden animate-reveal">
              {messageData.imageUrl && (
                <div className="flex justify-center pt-8 pb-4 bg-gradient-to-b from-love-50/50 to-transparent">
                  <div className="relative">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-love-200">
                      <img
                        src={messageData.imageUrl}
                        alt="Love message"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-btn shadow-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-8 pt-4 letter-paper">
                <div className="space-y-4 text-center">
                  {lines.map((line, i) => (
                    <p
                      key={i}
                      className="text-love-900 leading-relaxed animate-fade-in-up"
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        fontFamily: line.trim() === '' ? undefined : 'var(--font-caveat)',
                        fontSize: line.trim() === '' ? undefined : '1.25rem',
                      }}
                    >
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center text-love-300 text-xs animate-fade-in" style={{ animationDelay: '1s' }}>
              Made with <span className="text-love-400">&hearts;</span> via LoveQR
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-heart flex items-center justify-center p-4">
      <HeartParticles count={12} />

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-love-200/50 p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-btn shadow-lg mb-4">
            <svg className="w-8 h-8 text-white animate-heartbeat" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <h1 className="text-3xl font-heading text-gradient mb-1">You found a LoveQR!</h1>
          <p className="text-love-400 text-sm font-heading mb-6">Enter the password to read the secret message</p>

          {data?.imageUrl && (
            <div className="rounded-2xl overflow-hidden border-2 border-love-200 mb-6 shadow-sm">
              <img
                src={data.imageUrl}
                alt="Message preview"
                className="w-full max-h-60 object-contain bg-love-50"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setWrongPassword(false)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter the password..."
                className={`w-full px-4 py-3 pr-12 rounded-xl border-2 bg-white/80 focus:ring-2 outline-none transition-all text-love-900 placeholder:text-love-300 ${
                  wrongPassword
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-love-200 focus:border-love-400 focus:ring-love-200'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-love-400 hover:text-love-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
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
              {wrongPassword && (
                <p className="text-red-500 text-sm mt-2 animate-fade-in">
                  Wrong password. Try again.
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !password.trim()}
              className="w-full py-3.5 px-6 bg-gradient-btn text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Unlocking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Unlock Message
                </>
              )}
            </button>
          </div>

          <p className="text-love-300 text-xs mt-4">
            This message is password protected
          </p>
        </div>
      </div>
    </main>
  )
}
