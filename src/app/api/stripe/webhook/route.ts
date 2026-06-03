import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { subscriptionRowFromStripe } from '@/lib/stripe-sync';
import type Stripe from 'stripe';

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  // metadata.user_id est posé à la création du checkout (Task 4).
  const row = subscriptionRowFromStripe(sub as never);
  const { error } = await admin().from('subscriptions').upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error(`upsert subscriptions: ${error.message}`);
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'no signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid';
    return NextResponse.json({ error: `signature: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertFromSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break; // events ignorés : 200 quand même
    }
  } catch (err) {
    // Erreur de traitement → 500 pour que Stripe réessaie (idempotent via upsert).
    const msg = err instanceof Error ? err.message : 'handler error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
