'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setNewsletterOptIn(formData: FormData) {
  const optIn = formData.get('newsletter') === 'on';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('non authentifié');
  // Écriture sur sa propre ligne (RLS profiles_update_own autorise).
  const { error } = await supabase
    .from('profiles').update({ newsletter_opt_in: optIn }).eq('id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/profil');
}
