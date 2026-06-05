import { describe, it, expect } from 'vitest';
import type Stripe from 'stripe';
import { handleStripeEvent, type SubscriptionStore, type StripeGateway } from './handle-event';
import type { SubscriptionRow } from '../supabase/types';

const fakeStore = () => {
  const rows: SubscriptionRow[] = [];
  const store: SubscriptionStore = {
    async upsertSubscription(r) { rows.push(r); },
  };
  return { store, rows };
};

const subObject = (userId: string) =>
  ({
    id: 'sub_1',
    status: 'active',
    customer: 'cus_1',
    metadata: { user_id: userId },
    items: { data: [{ current_period_end: 1893456000 }] },
  }) as unknown as Stripe.Subscription;

const fakeGateway = (sub: Stripe.Subscription): StripeGateway => ({
  async retrieveSubscription() { return sub; },
});

describe('handleStripeEvent', () => {
  it('customer.subscription.updated → upsert de la ligne mappée', async () => {
    const { store, rows } = fakeStore();
    const event = {
      type: 'customer.subscription.updated',
      data: { object: subObject('user-42') },
    } as unknown as Stripe.Event;

    await handleStripeEvent(event, { store, stripe: fakeGateway(subObject('user-42')) });

    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe('user-42');
    expect(rows[0].status).toBe('active');
  });

  it('checkout.session.completed → récupère l\'abonnement puis upsert', async () => {
    const { store, rows } = fakeStore();
    const sub = subObject('user-99');
    const event = {
      type: 'checkout.session.completed',
      data: { object: { subscription: 'sub_1' } },
    } as unknown as Stripe.Event;

    await handleStripeEvent(event, { store, stripe: fakeGateway(sub) });

    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe('user-99');
  });

  it('event ignoré → aucun upsert', async () => {
    const { store, rows } = fakeStore();
    const event = { type: 'invoice.paid', data: { object: {} } } as unknown as Stripe.Event;
    await handleStripeEvent(event, { store, stripe: fakeGateway(subObject('x')) });
    expect(rows).toHaveLength(0);
  });
});
