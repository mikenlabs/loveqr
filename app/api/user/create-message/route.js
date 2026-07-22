import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { supabase, getServiceSupabase } from '@/lib/supabase'
import { TOKEN_COST } from '@/lib/supabase-client'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, message, password, mediaUrl, mediaTitle, mediaType } = await request.json()

    if (!imageUrl || !message || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
    }

    const svc = getServiceSupabase()
    const { data: profile } = await svc
      .from('profiles')
      .select('tokens')
      .eq('id', user.id)
      .single()

    if (!profile || profile.tokens < TOKEN_COST) {
      return NextResponse.json({ error: 'Not enough LoversCoins' }, { status: 402 })
    }

    const id = nanoid(10)
    const passwordHash = await bcrypt.hash(password, 10)

    const { error: insertError } = await svc.from('messages').insert({
      id,
      user_id: user.id,
      image_url: imageUrl,
      message,
      password_hash: passwordHash,
      media_url: mediaUrl || null,
      media_title: mediaTitle || null,
      media_type: mediaType || null,
      tokens_spent: TOKEN_COST,
      view_count: 0,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    await svc.from('profiles').update({
      tokens: profile.tokens - TOKEN_COST,
    }).eq('id', user.id)

    await svc.from('transactions').insert({
      user_id: user.id,
      type: 'spend',
      amount: -TOKEN_COST,
      description: 'Created a LoveQR message',
      message_id: id,
      created_at: new Date().toISOString(),
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const viewUrl = `${siteUrl}/m/${id}`

    return NextResponse.json({
      id,
      viewUrl,
      imageUrl,
      message,
      balance: profile.tokens - TOKEN_COST,
    })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
