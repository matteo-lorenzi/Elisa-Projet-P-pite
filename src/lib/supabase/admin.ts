import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase service-role (contourne la RLS). À n'utiliser que côté serveur,
 * après une vérification d'accès explicite. Centralise la lecture des secrets :
 * un seul lieu lit l'URL et la clé service-role.
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant');
  return createClient(url, key);
}
