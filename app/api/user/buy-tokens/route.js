import { NextResponse } from 'next/server'
import { supabase, getServiceSupabase } from '@/lib/supabase'
import { PACKAGES } from '@/lib/supabase-client'
import { getStripe } from '@/lib/stripe'

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

    const { packageId } = await request.json()
    const pkg = PACKAGES.find((p) => p.id === packageId)

    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const useStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!useStripe) {
      const svc = getServiceSupabase()
      const { data: profile } = await svc
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const newBalance = (profile?.tokens ?? 0) + pkg.tokens

      await svc.from('profiles').update({ tokens: newBalance }).eq('id', user.id)

      await svc.from('transactions').insert({
        user_id: user.id,
        type: 'purchase',
        amount: pkg.tokens,
        description: `${pkg.label} package`,
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        tokens: pkg.tokens,
        balance: newBalance,
      })
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${pkg.tokens} LoversCoins` },
            unit_amount: pkg.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/dashboard?buy_success=${pkg.tokens}`,
      cancel_url: `${request.nextUrl.origin}/dashboard?buy_cancelled=1`,
      metadata: { user_id: user.id, package_id: packageId, tokens: pkg.tokens },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Buy tokens error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
