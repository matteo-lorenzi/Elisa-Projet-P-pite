/**
 * Variables publiques (NEXT_PUBLIC_*). Importable client ET serveur.
 * Getters à références littérales : Next inline `process.env.NEXT_PUBLIC_*`
 * dans le bundle navigateur (le littéral reste textuel dans le getter), tout
 * en restant lu dynamiquement côté serveur/test. Pas de secret ici.
 */
export const publicEnv = {
  get SUPABASE_URL() { return process.env.NEXT_PUBLIC_SUPABASE_URL; },
  get SUPABASE_ANON_KEY() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; },
  get SITE_URL() { return process.env.NEXT_PUBLIC_SITE_URL; },
};

/** Lit une variable publique requise. Throw si absente/vide. */
export function requiredPublic(key: keyof typeof publicEnv): string {
  const value = publicEnv[key];
  if (!value) throw new Error(`NEXT_PUBLIC_${key} manquant`);
  return value;
}
