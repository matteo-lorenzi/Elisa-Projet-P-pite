'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { requiredPublic } from '@/lib/env/public';
import { env } from '@/lib/env/server';

const siteUrl = (): string => requiredPublic('SITE_URL');

export async function createCheckoutSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions').select('stripe_customer_id')
    .eq('user_id', user.id).maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : (user.email ?? undefined),
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${siteUrl()}/abonnement?success=1`,
    cancel_url: `${siteUrl()}/abonnement?canceled=1`,
  });

  if (!session.url) throw new Error('Stripe: pas d’URL de checkout');
  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions').select('stripe_customer_id')
    .eq('user_id', user.id).maybeSingle();
  if (!sub?.stripe_customer_id) redirect('/abonnement');

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl()}/abonnement`,
  });
  redirect(session.url);
}
