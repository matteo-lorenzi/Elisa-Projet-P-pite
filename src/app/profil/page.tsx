import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { Button, CheckboxField } from '@/components/ui';
import { setNewsletterOptIn } from './actions';

export default async function ProfilPage() {
  const supabase = await createClient();
  const { profile } = await requireViewer(supabase);

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
        Mon profil
      </h1>

      <dl className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-4">
        <dt className="text-sm text-muted">Adresse e-mail</dt>
        <dd className="mt-0.5 font-medium text-foreground">{profile?.email}</dd>
      </dl>

      <form action={setNewsletterOptIn} className="mt-6 flex flex-col gap-5">
        <CheckboxField
          name="newsletter"
          value="on"
          defaultChecked={profile?.newsletter_opt_in ?? false}
          label="Recevoir la newsletter des évolutions du droit rural"
        />
        <Button type="submit" className="self-start">
          Enregistrer
        </Button>
      </form>
    </main>
  );
}
