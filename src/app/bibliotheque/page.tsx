import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { hasPremiumAccess } from '@/lib/access';
import { DocumentCard } from '@/components/DocumentCard';
import { buttonClass } from '@/components/ui';
import type { DocumentRow } from '@/lib/supabase/types';

const control =
  'w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted transition focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();
  const { profile, subscription } = await requireViewer(supabase);

  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (q) query = query.ilike('title', `%${q}%`);
  const { data: documents } = await query;

  const premium = hasPremiumAccess(profile, subscription);
  const docs = (documents as DocumentRow[] | null) ?? [];
  const filtered = Boolean(q || category);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
        Bibliothèque
      </h1>
      <p className="mt-2 max-w-[55ch] text-muted">
        Documents et schémas pour comprendre le droit rural, sans jargon.
      </p>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium text-foreground">
            Rechercher
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Un titre, un thème…"
            className={control}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:w-56">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Catégorie
          </label>
          <input
            id="category"
            name="category"
            defaultValue={category ?? ''}
            placeholder="Baux, succession…"
            className={control}
          />
        </div>
        <button type="submit" className={buttonClass({ className: 'sm:w-auto' })}>
          Filtrer
        </button>
      </form>

      {docs.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} locked={doc.is_premium && !premium} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[var(--radius)] border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            {filtered ? 'Aucun document ne correspond' : 'La bibliothèque est vide'}
          </p>
          <p className="mx-auto mt-2 max-w-[40ch] text-muted">
            {filtered
              ? 'Essayez un autre terme ou élargissez la recherche.'
              : 'Les premiers documents arrivent bientôt.'}
          </p>
          {filtered && (
            <Link href="/bibliotheque" className={buttonClass({ variant: 'secondary', className: 'mt-6' })}>
              Réinitialiser les filtres
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
