import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile, SubscriptionRow } from '../supabase/types';

export interface Viewer {
  user: User;
  profile: Profile;
  subscription: SubscriptionRow | null;
}

/**
 * Contexte d'accès du visiteur courant : utilisateur, profil, abonnement.
 * Renvoie null si personne n'est connecté. Le client est passé en paramètre
 * (l'appelant le crée déjà) → testable sans mocker next/headers.
 */
export async function getViewer(supabase: SupabaseClient): Promise<Viewer | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  // Authentifié mais profil illisible (session incohérente / cookie périmé) :
  // on traite comme non connecté pour éviter un 500 en aval. requireViewer
  // redirige alors vers /login, qui réécrit des cookies propres à la connexion.
  if (!profile) return null;

  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();

  return {
    user,
    profile: profile as Profile,
    subscription: (subscription as SubscriptionRow | null) ?? null,
  };
}

/** Pages protégées : renvoie le contexte ou redirige vers /login. */
export async function requireViewer(supabase: SupabaseClient): Promise<Viewer> {
  const viewer = await getViewer(supabase);
  if (!viewer) redirect('/login');
  return viewer;
}
