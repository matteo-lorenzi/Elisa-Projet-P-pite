'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const optIn = formData.get('newsletter') === 'on';
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  // Session active en dev (confirmation désactivée) : on écrit l'opt-in sur sa propre ligne.
  if (optIn && data.user) {
    await supabase.from('profiles').update({ newsletter_opt_in: true }).eq('id', data.user.id);
  }
  redirect('/bibliotheque');
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/bibliotheque');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
