# LoveQR — Secret Love Messages in QR Codes

Upload a photo, write a message from the heart, and lock it with a password. LoveQR generates a QR code (no white background) that you embed in your image — when scanned, it takes your special someone to a page where they enter the password to read your message.

Built with Next.js 14, Supabase, and Tailwind CSS.

## How It Works

1. **Create** — Upload a photo, write your message, set a password
2. **Share** — Download the image with the QR code embedded (transparent background, only the dark modules show)
3. **Reveal** — Recipient scans the QR code, enters the password, and sees your message with love-themed animations

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (images)
- **Auth:** Password-based message protection (bcryptjs)
- **QR Code:** `qrcode` library (client-side generation)
- **Styling:** Tailwind CSS + Custom love-themed animations
- **Typography:** Caveat (headings) + Quicksand (body)

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/mikenlabs/loveqr.git
cd loveqr
npm install
```

### 2. Set Up Supabase

Create a project at [supabase.com](https://supabase.com), then run the migration:

```sql
-- Run supabase/migrations/001_create_messages.sql in the Supabase SQL Editor
```

This creates:
- `messages` table (id, image_url, message, password_hash, view_count, created_at)
- `loveqr-images` storage bucket (public)
- RLS policies for public read/write

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for server-side write access) |
| `NEXT_PUBLIC_SITE_URL` | Your app URL (e.g., `https://loveqr.vercel.app`) |

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mikenlabs/loveqr)

Set the environment variables in the Vercel dashboard (same as `.env.local`).

## Project Structure

```
loveqr/
├── app/
│   ├── api/
│   │   ├── create/route.js         # Create message endpoint
│   │   ├── messages/[id]/route.js  # Get/verify message endpoint
│   │   └── upload/route.js         # Image upload endpoint
│   ├── m/[id]/page.jsx             # View message page (QR target)
│   ├── globals.css                 # Love-themed styles
│   ├── layout.jsx                  # Root layout
│   └── page.jsx                    # Create message page
├── components/
│   └── HeartParticles.jsx          # Floating hearts animation
├── lib/
│   ├── qr.js                       # QR code generation (client-side)
│   └── supabase.js                 # Supabase client
├── supabase/
│   └── migrations/
│       └── 001_create_messages.sql
├── design-system/
│   └── loveqr/
│       └── MASTER.md               # Design system documentation
└── package.json
```

## QR Code Design

The QR code is rendered **without a white background** — only the dark module dots are drawn. A semi-transparent dark backdrop ensures scannability on any image. The result is a clean, minimal QR that blends with your photo.

## Design System

See `design-system/loveqr/MASTER.md` for the complete design specification including:
- Color palette (rose, pink, red gradient)
- Typography (Caveat + Quicksand)
- Spacing & shadow tokens
- Component specs
- Anti-patterns

---

Built by [MikenLabs](https://github.com/mikenlabs)
