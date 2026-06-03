'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

export async function setUserRole(formData: FormData) {
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as Role;
  if (!ROLES.includes(role)) throw new Error('rôle invalide');

  // Garde : l'appelant doit être admin.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('non authentifié');
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') throw new Error('accès refusé');

  // Écriture via service role.
  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await adminDb.from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}
