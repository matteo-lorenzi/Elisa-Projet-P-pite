import 'server-only';

/** Lit une variable serveur requise. Throw au premier accès si absente/vide. */
function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} manquant`);
  return value;
}

/**
 * Seam d'accès aux secrets serveur. Getters lazy : seul le champ lu est validé
 * (isolation des tests préservée). `server-only` interdit l'import côté client.
 * La validation whole-set au boot reste dans instrumentation.ts (readEnv).
 */
export const env = {
  get SERVICE_ROLE_KEY() { return required('SUPABASE_SERVICE_ROLE_KEY'); },
  get STRIPE_SECRET_KEY() { return required('STRIPE_SECRET_KEY'); },
  get STRIPE_WEBHOOK_SECRET() { return required('STRIPE_WEBHOOK_SECRET'); },
  get STRIPE_PRICE_ID() { return required('STRIPE_PRICE_ID'); },
  get RESEND_API_KEY() { return required('RESEND_API_KEY'); },
  get NEWSLETTER_FROM() { return required('NEWSLETTER_FROM'); },
  get NEWSLETTER_UNSUBSCRIBE_SECRET() { return required('NEWSLETTER_UNSUBSCRIBE_SECRET'); },
};
