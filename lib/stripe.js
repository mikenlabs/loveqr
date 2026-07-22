import Stripe from 'stripe'

let stripeInstance = null

export function getStripe() {
  if (stripeInstance) return stripeInstance
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  stripeInstance = new Stripe(key, { apiVersion: '2023-10-16' })
  return stripeInstance
}
