import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('messages')
      .select('id, image_url, view_count, created_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: data.id,
      imageUrl: data.image_url,
      viewCount: data.view_count,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error('Get message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    const valid = await bcrypt.compare(password, data.password_hash)

    if (!valid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    await supabase
      .from('messages')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({
      id: data.id,
      imageUrl: data.image_url,
      message: data.message,
      songUrl: data.song_url,
      songTitle: data.song_title,
      viewCount: data.view_count + 1,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error('Verify password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
