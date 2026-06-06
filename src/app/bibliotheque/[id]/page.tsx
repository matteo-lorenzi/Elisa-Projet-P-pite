import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { canViewDocumentFile } from '@/lib/access';
import { PdfViewer } from '@/components/PdfViewer';
import { buttonClass } from '@/components/ui';
import type { DocumentRow } from '@/lib/supabase/types';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { profile, subscription } = await requireViewer(supabase);
  const { data } = await supabase
    .from('documents').select('*').eq('id', id).single();

  if (!data) redirect('/bibliotheque');
  const doc = data as DocumentRow;
  const allowed = canViewDocumentFile(profile, subscription, doc);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/bibliotheque"
        className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span> Bibliothèque
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance">
        {doc.title}
      </h1>
      {doc.author && (
        <p className="mt-1 text-sm text-muted">Par {doc.author}</p>
      )}
      {doc.description && (
        <p className="mt-4 max-w-[65ch] leading-relaxed text-foreground">
          {doc.description}
        </p>
      )}

      <div className="mt-8">
        {allowed ? (
          <PdfViewer docId={doc.id} type={doc.type} />
        ) : (
          <div className="rounded-[var(--radius)] border border-border bg-surface px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              Document réservé aux abonnés
            </p>
            <p className="mx-auto mt-2 max-w-[42ch] text-muted">
              Abonnez-vous pour débloquer ce document et l’ensemble de la
              bibliothèque premium.
            </p>
            <Link href="/abonnement" className={buttonClass({ className: 'mt-6' })}>
              Voir l’abonnement
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
