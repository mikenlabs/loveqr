import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServiceSupabase } from '@/lib/supabase'

const ADMIN_PASSWORD = 'loveqr123'

export async function PUT(request, { params }) {
  try {
    const adminPw = request.headers.get('x-admin-password')
    if (adminPw !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { message, password, songUrl, songTitle } = await request.json()

    const supabase = getServiceSupabase()
    const updates = {}

    if (message !== undefined) {
      if (message.length > 5000) {
        return NextResponse.json({ error: 'Message too long' }, { status: 400 })
      }
      updates.message = message
    }

    if (password !== undefined) {
      if (password.length < 4) {
        return NextResponse.json({ error: 'Password too short' }, { status: 400 })
      }
      updates.password_hash = await bcrypt.hash(password, 10)
    }

    if (songUrl !== undefined) updates.song_url = songUrl || null
    if (songTitle !== undefined) updates.song_title = songTitle || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Admin update error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
