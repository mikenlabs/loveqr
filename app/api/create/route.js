import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { imageUrl, message, password } = await request.json()

    if (!imageUrl || !message || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      )
    }

    const id = nanoid(10)
    const passwordHash = await bcrypt.hash(password, 10)

    const supabase = getServiceSupabase()

    const { error } = await supabase.from('messages').insert({
      id,
      image_url: imageUrl,
      message,
      password_hash: passwordHash,
      view_count: 0,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const viewUrl = `${siteUrl}/m/${id}`

    return NextResponse.json({
      id,
      viewUrl,
      imageUrl,
      message,
    })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
