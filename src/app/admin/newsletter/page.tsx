import { createClient } from '@/lib/supabase/server';
import { Banner, Button, TextField, TextareaField } from '@/components/ui';
import { saveDraft, sendEdition } from './actions';
import type { NewsletterEdition } from '@/lib/supabase/types';

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; preview?: string }>;
}) {
  const { msg, preview } = await searchParams;
  const supabase = await createClient();
  const { data: editions } = await supabase
    .from('newsletter_editions')
    .select('*')
    .order('sent_at', { ascending: false, nullsFirst: true });
  const list = (editions as NewsletterEdition[] | null) ?? [];

  return (
    <main>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
        Newsletter
      </h1>
      <p className="mt-2 max-w-[55ch] text-muted">
        Rédigez en Markdown, enregistrez un brouillon ou envoyez l’édition aux
        inscrits.
      </p>

      {msg && (
        <Banner tone="info" className="mt-6">
          {msg}
        </Banner>
      )}

      <form className="mt-8 flex max-w-2xl flex-col gap-5">
        <TextField name="subject" label="Sujet" required placeholder="Objet de l’édition" />
        <TextareaField
          name="body_md"
          label="Corps (Markdown)"
          rows={12}
          defaultValue={preview ?? ''}
          className="font-mono text-sm"
          placeholder="# Titre&#10;&#10;Votre contenu…"
        />
        <div className="flex flex-wrap gap-3">
          <Button formAction={saveDraft} variant="secondary">
            Enregistrer le brouillon
          </Button>
          <Button formAction={sendEdition}>Envoyer l’édition</Button>
        </div>
      </form>

      <h2 className="mt-12 font-display text-xl font-semibold tracking-tight">
        Historique
      </h2>
      {list.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-muted">
                <th className="px-4 py-3 font-medium">Sujet</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{e.subject}</td>
                  <td className="px-4 py-3">
                    {e.sent_at ? (
                      <span className="text-success">
                        Envoyé le {new Date(e.sent_at).toLocaleString('fr-FR')}
                      </span>
                    ) : (
                      <span className="text-muted">Brouillon</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-muted">Aucune édition pour l’instant.</p>
      )}
    </main>
  );
}
