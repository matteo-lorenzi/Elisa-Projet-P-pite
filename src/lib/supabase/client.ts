import { createBrowserClient } from '@supabase/ssr';
import { requiredPublic } from '../env/public';

export function createClient() {
  return createBrowserClient(
    requiredPublic('SUPABASE_URL'),
    requiredPublic('SUPABASE_ANON_KEY'),
  );
}
