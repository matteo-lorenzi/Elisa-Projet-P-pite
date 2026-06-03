import type { SubscriptionRow } from './supabase/types';

// Forme minimale d'un Stripe.Subscription dont on a besoin (évite de dépendre
// du type complet du SDK ici ; le webhook passe le vrai objet, compatible).
// Depuis l'API dahlia, current_period_end vit sur les items, pas au top-level.
export interface StripeSubscriptionLike {
  id: string;
  status: string;
  customer: string | { id: string };
  current_period_end?: number | null; // legacy top-level (anciennes versions API)
  items?: { data: Array<{ current_period_end?: number | null }> };
  metadata: Record<string, string>;
}

export function subscriptionRowFromStripe(
  sub: StripeSubscriptionLike,
): SubscriptionRow {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    throw new Error('subscriptionRowFromStripe: user_id manquant dans metadata');
  }
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // dahlia : items.data[0].current_period_end ; fallback top-level pour compat.
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null;
  return {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  };
}
