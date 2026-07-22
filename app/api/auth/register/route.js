import { NextResponse } from 'next/server'
import { supabase, getServiceSupabase } from '@/lib/supabase'
import { TOKEN_BONUS } from '@/lib/supabase-client'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      const svc = getServiceSupabase()
      await svc.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email,
        tokens: TOKEN_BONUS,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
