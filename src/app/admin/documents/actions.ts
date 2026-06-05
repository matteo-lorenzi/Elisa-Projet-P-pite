'use server';

import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth/admin';

export async function createDocument(formData: FormData) {
  const supabase = await createServerClient();
  await requireAdminPage(supabase);

  const title = String(formData.get('title'));
  const description = String(formData.get('description') || '') || null;
  const author = String(formData.get('author') || '') || null;
  const category = String(formData.get('category') || '') || null;
  const type = String(formData.get('type')) as 'pdf' | 'schema';
  const isPremium = formData.get('is_premium') === 'on';
  const tags = String(formData.get('tags') || '')
    .split(',').map((t) => t.trim()).filter(Boolean);
  const file = formData.get('file') as File;

  const admin = createServiceRoleClient();
  const bucket = isPremium ? 'documents-premium' : 'documents-free';
  // Les clés storage doivent être URL-safe : on retire les accents et on
  // remplace tout caractère hors [a-z0-9._-] par un tiret.
  const safeName = file.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const path = `${Date.now()}-${safeName}`;
  const { error: upErr } = await admin.storage.from(bucket)
    .upload(path, file, { upsert: false });
  if (upErr) redirect(`/admin/documents/new?error=${encodeURIComponent(upErr.message)}`);

  const { error: insErr } = await admin.from('documents').insert({
    title, description, author, category, type,
    is_premium: isPremium, tags, storage_path: path,
  });
  if (insErr) redirect(`/admin/documents/new?error=${encodeURIComponent(insErr.message)}`);

  redirect('/admin/documents');
}
