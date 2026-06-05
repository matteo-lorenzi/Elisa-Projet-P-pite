import type Stripe from 'stripe';
import { subscriptionRowFromStripe } from '../stripe-sync';
import type { SubscriptionRow } from '../supabase/types';

export interface SubscriptionStore {
  upsertSubscription(row: SubscriptionRow): Promise<void>;
}

export interface StripeGateway {
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
}

/** Route un event Stripe vérifié vers l'upsert d'abonnement. Pur, dépendances injectées. */
export async function handleStripeEvent(
  event: Stripe.Event,
  deps: { store: SubscriptionStore; stripe: StripeGateway },
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await deps.stripe.retrieveSubscription(session.subscription as string);
        await deps.store.upsertSubscription(subscriptionRowFromStripe(sub as never));
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await deps.store.upsertSubscription(
        subscriptionRowFromStripe(event.data.object as never),
      );
      break;
    default:
      break;
  }
}
