import { createClient } from '@/lib/supabase/server';
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

  return (
    <main>
      <h1 className="text-2xl font-bold">Newsletter</h1>
      {msg && <p className="mt-2 rounded bg-gray-100 p-2 text-sm">{msg}</p>}

      <form className="mt-4 flex flex-col gap-3">
        <input name="subject" required placeholder="Sujet"
          className="border p-2 rounded" defaultValue="" />
        <textarea name="body_md" rows={10} placeholder="Corps en Markdown"
          className="border p-2 rounded font-mono text-sm" defaultValue={preview ?? ''} />
        <div className="flex gap-2">
          <button formAction={saveDraft}
            className="rounded border px-3 py-2">Enregistrer brouillon</button>
          <button formAction={sendEdition}
            className="rounded bg-black px-3 py-2 text-white">Envoyer</button>
        </div>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Historique</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left"><th className="py-2">Sujet</th><th>Statut</th></tr>
        </thead>
        <tbody>
          {(editions as NewsletterEdition[] ?? []).map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2">{e.subject}</td>
              <td>{e.sent_at ? `envoyé le ${new Date(e.sent_at).toLocaleString('fr-FR')}` : 'brouillon'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
