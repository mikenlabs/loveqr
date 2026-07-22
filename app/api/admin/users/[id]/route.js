import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

const ADMIN_PASSWORD = 'loveqr123'

export async function PUT(request, { params }) {
  try {
    const adminPw = request.headers.get('x-admin-password')
    if (adminPw !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { tokens } = await request.json()

    if (tokens === undefined || tokens < 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const diff = tokens - (profile.tokens || 0)

    await supabase.from('profiles').update({ tokens }).eq('id', id)

    if (diff !== 0) {
      await supabase.from('transactions').insert({
        user_id: id,
        type: 'adjustment',
        amount: diff,
        description: diff > 0 ? 'Admin credit adjustment' : 'Admin debit adjustment',
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, tokens })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
