import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requiredPublic } from '../env/public';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requiredPublic('SUPABASE_URL'),
    requiredPublic('SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // appelé depuis un Server Component : ignoré, le middleware rafraîchit
          }
        },
      },
    },
  );
}
