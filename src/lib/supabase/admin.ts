import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requiredPublic } from '../env/public';
import { env } from '../env/server';

/**
 * Client Supabase service-role (contourne la RLS). À n'utiliser que côté serveur,
 * après une vérification d'accès explicite. L'URL et la clé service-role passent
 * par le seam env (public + serveur).
 */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(requiredPublic('SUPABASE_URL'), env.SERVICE_ROLE_KEY);
}
