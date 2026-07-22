'use client'

import Link from 'next/link'
import HeartParticles from '@/components/HeartParticles'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-heart flex flex-col items-center justify-center p-4 relative">
      <HeartParticles count={15} />

      <div className="w-full max-w-lg animate-fade-in-up text-center relative z-10">
        <img src="/logo.png" alt="LoveQR" className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-5xl sm:text-6xl font-heading text-gradient mb-3">LoveQR</h1>
        <p className="text-love-400 text-lg sm:text-xl font-heading mb-2">Secret love messages in QR codes</p>
        <p className="text-love-300 text-sm mb-10 max-w-sm mx-auto">
          Upload a photo, write a secret message, and share it with a QR code.
          Only the one with the password can read it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-btn text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-love-600 rounded-2xl font-semibold text-lg border-2 border-love-200 shadow-md hover:bg-love-50 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-love-100">
            <div className="w-10 h-10 rounded-full bg-love-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-love-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-love-700 font-heading text-lg">Upload</p>
            <p className="text-love-300 text-xs">a photo</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-love-100">
            <div className="w-10 h-10 rounded-full bg-love-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-love-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <p className="text-love-700 font-heading text-lg">Write</p>
            <p className="text-love-300 text-xs">a secret message</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-love-100">
            <div className="w-10 h-10 rounded-full bg-love-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-love-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553l-10.5 3M9 9l10.5-3M9 9l3.75 3.75M9 9l-3.75 3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-love-700 font-heading text-lg">Share</p>
            <p className="text-love-300 text-xs">with a QR code</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/admin"
            className="text-xs text-love-200 hover:text-love-400 transition-colors"
          >
            Admin Access
          </Link>
        </div>
      </div>
    </main>
  )
}
