export const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'RESEND_API_KEY',
  'NEWSLETTER_FROM',
  'NEWSLETTER_UNSUBSCRIBE_SECRET',
  'NEXT_PUBLIC_SITE_URL',
] as const;

export type EnvKey = (typeof REQUIRED_ENV)[number];

/** Valide une source d'environnement et renvoie les variables typées, ou throw. */
export function readEnv(source: Record<string, string | undefined>): Record<EnvKey, string> {
  const missing = REQUIRED_ENV.filter((k) => !source[k]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  return Object.fromEntries(REQUIRED_ENV.map((k) => [k, source[k]!])) as Record<EnvKey, string>;
}
