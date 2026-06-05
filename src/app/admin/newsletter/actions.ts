'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { renderMarkdown } from '@/lib/markdown';
import { buildEmailHtml } from '@/lib/newsletter-email';
import { sendBatch, type OutgoingEmail } from '@/lib/resend';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('non authentifié');
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') throw new Error('accès refusé');
}

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function saveDraft(formData: FormData) {
  await assertAdmin();
  const subject = String(formData.get('subject')).trim();
  const md = String(formData.get('body_md'));
  if (!subject) throw new Error('sujet requis');
  const body_html = renderMarkdown(md);
  const { error } = await adminDb()
    .from('newsletter_editions').insert({ subject, body_html, sent_at: null });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/newsletter');
}

export async function sendEdition(formData: FormData) {
  await assertAdmin();
  const subject = String(formData.get('subject')).trim();
  const md = String(formData.get('body_md'));
  if (!subject) throw new Error('sujet requis');
  const body_html = renderMarkdown(md);

  const db = adminDb();
  const { data: recipients, error: recErr } = await db
    .from('profiles').select('id, email').eq('newsletter_opt_in', true);
  if (recErr) throw new Error(recErr.message);
  if (!recipients || recipients.length === 0) {
    revalidatePath('/admin/newsletter');
    redirect('/admin/newsletter?msg=' + encodeURIComponent('aucun inscrit'));
  }

  const emails: OutgoingEmail[] = recipients.map((r) => ({
    to: r.email,
    subject,
    html: buildEmailHtml(body_html, r.id),
  }));
  const { sent, failed } = await sendBatch(emails);

  const { error: insErr } = await db
    .from('newsletter_editions')
    .insert({ subject, body_html, sent_at: new Date().toISOString() });
  if (insErr) throw new Error(insErr.message);

  revalidatePath('/admin/newsletter');
  redirect('/admin/newsletter?msg=' + encodeURIComponent(`envoyé: ${sent}, échecs: ${failed}`));
}
