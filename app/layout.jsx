import { Caveat, Quicksand } from 'next/font/google'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
const baseUrl = siteUrl && siteUrl.startsWith('http') ? siteUrl : 'https://loveqr.vercel.app'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: 'LoveQR - Secret Love Messages',
  description: 'Create encrypted love messages hidden in QR codes. Share your heart in a truly unique way.',
  icons: {
    icon: '/favicon.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'LoveQR - Secret Love Messages',
    description: 'Create encrypted love messages hidden in QR codes.',
    type: 'website',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${quicksand.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
