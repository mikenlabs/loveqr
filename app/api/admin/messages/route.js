import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

const ADMIN_PASSWORD = 'loveqr123'

export async function GET(request) {
  const adminPw = request.headers.get('x-admin-password')
  if (adminPw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('messages')
    .select('id, image_url, message, song_url, song_title, view_count, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin list error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json(data)
}
