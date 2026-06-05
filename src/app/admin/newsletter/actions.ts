'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { sendBatch } from '@/lib/resend';
import { requireAdminAction } from '@/lib/auth/admin';
import {
  publishEdition,
  saveEditionDraft,
  type NewsletterStore,
  type Mailer,
} from '@/lib/newsletter/publish';

async function assertAdmin() {
  await requireAdminAction(await createClient());
}

/** Adapter service-role : destinataires opt-in + historique des éditions. */
function supabaseStore(): NewsletterStore {
  const db = createServiceRoleClient();
  return {
    async listOptInRecipients() {
      const { data, error } = await db
        .from('profiles').select('id, email').eq('newsletter_opt_in', true);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    async recordEdition(edition) {
      const { error } = await db.from('newsletter_editions').insert(edition);
      if (error) throw new Error(error.message);
    },
  };
}

const mailer: Mailer = { send: sendBatch };

export async function saveDraft(formData: FormData) {
  await assertAdmin();
  await saveEditionDraft(
    { subject: String(formData.get('subject')), markdown: String(formData.get('body_md')) },
    { store: supabaseStore() },
  );
  revalidatePath('/admin/newsletter');
}

export async function sendEdition(formData: FormData) {
  await assertAdmin();
  const res = await publishEdition(
    { subject: String(formData.get('subject')), markdown: String(formData.get('body_md')) },
    { store: supabaseStore(), mailer },
  );
  revalidatePath('/admin/newsletter');
  const msg =
    res.kind === 'no-recipients'
      ? 'aucun inscrit'
      : `envoyé: ${res.sent}, échecs: ${res.failed}`;
  redirect('/admin/newsletter?msg=' + encodeURIComponent(msg));
}
