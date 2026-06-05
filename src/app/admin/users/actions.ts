'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { requireAdminAction } from '@/lib/auth/admin';
import type { Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

export async function setUserRole(formData: FormData) {
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as Role;
  if (!ROLES.includes(role)) throw new Error('rôle invalide');

  // Garde : l'appelant doit être admin.
  await requireAdminAction(await createClient());

  // Écriture via service role.
  const adminDb = createServiceRoleClient();
  const { error } = await adminDb.from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}
