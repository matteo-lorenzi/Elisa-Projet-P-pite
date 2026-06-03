import { describe, it, expect } from 'vitest';
import { subscriptionRowFromStripe } from './stripe-sync';

describe('subscriptionRowFromStripe', () => {
  it('mappe un abonnement actif (period_end depuis items.data[0])', () => {
    const row = subscriptionRowFromStripe({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      items: { data: [{ current_period_end: 1764547200 }] }, // epoch seconds
      metadata: { user_id: 'u1' },
    });
    expect(row).toEqual({
      user_id: 'u1',
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
      status: 'active',
      current_period_end: new Date(1764547200 * 1000).toISOString(),
    });
  });

  it('customer peut être un objet (expand) → on prend son id ; pas de period → null', () => {
    const row = subscriptionRowFromStripe({
      id: 'sub_9', status: 'past_due',
      customer: { id: 'cus_9' },
      items: { data: [] },
      metadata: { user_id: 'u9' },
    });
    expect(row.stripe_customer_id).toBe('cus_9');
    expect(row.status).toBe('past_due');
    expect(row.current_period_end).toBeNull();
  });

  it('lève si user_id absent des metadata', () => {
    expect(() =>
      subscriptionRowFromStripe({
        id: 's', status: 'active', customer: 'c',
        items: { data: [{ current_period_end: 1 }] }, metadata: {},
      }),
    ).toThrow(/user_id/);
  });
});
