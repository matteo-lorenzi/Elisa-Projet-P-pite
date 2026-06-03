import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquant');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
