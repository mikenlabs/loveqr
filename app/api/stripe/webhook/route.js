import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export async function POST(request) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
    }
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const tokens = parseInt(session.metadata?.tokens || '0')

      if (userId && tokens > 0) {
        const svc = getServiceSupabase()

        const { data: profile } = await svc
          .from('profiles')
          .select('tokens')
          .eq('id', userId)
          .single()

        const newBalance = (profile?.tokens ?? 0) + tokens

        await svc.from('profiles').update({ tokens: newBalance }).eq('id', userId)

        await svc.from('transactions').insert({
          user_id: userId,
          type: 'purchase',
          amount: tokens,
          description: `Stripe purchase`,
          created_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
