import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buttonClass, PageHeader } from '@/components/ui';
import type { DocumentRow } from '@/lib/supabase/types';

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from('documents').select('*').order('created_at', { ascending: false });
  const docs = (documents as DocumentRow[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Documents"
        lead="Gérez la bibliothèque : ajoutez, publiez et suivez vos documents."
        actions={
          <Link href="/admin/documents/new" className={buttonClass({ size: 'sm' })}>
            Nouveau document
          </Link>
        }
      />

      {docs.length > 0 ? (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-4 bg-surface px-4 py-3"
            >
              <span className="truncate font-medium text-foreground">{d.title}</span>
              <span className="flex shrink-0 items-center gap-2 text-xs">
                <span
                  className={`rounded-[var(--radius)] border px-2 py-0.5 font-medium ${
                    d.is_premium ? 'border-accent text-accent' : 'border-border text-muted'
                  }`}
                >
                  {d.is_premium ? 'Premium' : 'Gratuit'}
                </span>
                <span className="text-muted uppercase">{d.type}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-[var(--radius)] border border-dashed border-border bg-surface px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            Aucun document publié
          </p>
          <p className="mx-auto mt-2 max-w-[40ch] text-muted">
            Créez votre premier document pour alimenter la bibliothèque.
          </p>
          <Link href="/admin/documents/new" className={buttonClass({ className: 'mt-6' })}>
            Nouveau document
          </Link>
        </div>
      )}
    </div>
  );
}
