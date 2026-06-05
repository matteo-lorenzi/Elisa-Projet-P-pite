import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { handleStripeEvent } from '@/lib/stripe/handle-event';
import type Stripe from 'stripe';
import type { SubscriptionRow } from '@/lib/supabase/types';

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
    await handleStripeEvent(event, {
      store: {
        async upsertSubscription(row: SubscriptionRow) {
          const { error } = await createServiceRoleClient()
            .from('subscriptions').upsert(row, { onConflict: 'user_id' });
          if (error) throw new Error(`upsert subscriptions: ${error.message}`);
        },
      },
      stripe: {
        retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'handler error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
