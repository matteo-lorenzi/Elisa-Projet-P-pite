'use server';

import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function createDocument(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/bibliotheque');

  const title = String(formData.get('title'));
  const description = String(formData.get('description') || '') || null;
  const author = String(formData.get('author') || '') || null;
  const category = String(formData.get('category') || '') || null;
  const type = String(formData.get('type')) as 'pdf' | 'schema';
  const isPremium = formData.get('is_premium') === 'on';
  const tags = String(formData.get('tags') || '')
    .split(',').map((t) => t.trim()).filter(Boolean);
  const file = formData.get('file') as File;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const bucket = isPremium ? 'documents-premium' : 'documents-free';
  const path = `${Date.now()}-${file.name}`;
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
