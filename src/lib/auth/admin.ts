import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../supabase/types';

export type AdminResult =
  | { ok: true; profile: Profile }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' };

/**
 * Cœur de la garde admin : lit l'utilisateur courant et son profil, distingue
 * « non authentifié » de « authentifié mais pas admin ». Le client est passé en
 * paramètre (l'appelant le crée déjà) → testable sans mocker next/headers.
 */
export async function loadAdmin(supabase: SupabaseClient): Promise<AdminResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile || (profile as Profile).role !== 'admin') {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, profile: profile as Profile };
}

/** Server Components / layouts : redirige (login si anonyme, bibliothèque sinon). */
export async function requireAdminPage(supabase: SupabaseClient): Promise<Profile> {
  const r = await loadAdmin(supabase);
  if (!r.ok) redirect(r.reason === 'unauthenticated' ? '/login' : '/bibliotheque');
  return r.profile;
}

/** Server actions : jette une erreur (remonte au formulaire). */
export async function requireAdminAction(supabase: SupabaseClient): Promise<Profile> {
  const r = await loadAdmin(supabase);
  if (!r.ok) throw new Error(r.reason === 'unauthenticated' ? 'non authentifié' : 'accès refusé');
  return r.profile;
}

/** Route handlers : renvoie une Response d'erreur, ou le profil si admin. */
export async function requireAdminApi(supabase: SupabaseClient): Promise<Profile | Response> {
  const r = await loadAdmin(supabase);
  if (!r.ok) {
    return r.reason === 'unauthenticated'
      ? new Response('non authentifié', { status: 401 })
      : new Response('accès refusé', { status: 403 });
  }
  return r.profile;
}
