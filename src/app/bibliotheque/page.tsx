import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { hasPremiumAccess } from '@/lib/access';
import { DocumentCard } from '@/components/DocumentCard';
import type { DocumentRow } from '@/lib/supabase/types';

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

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Bibliothèque</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" placeholder="Rechercher un titre" className="border p-2 rounded flex-1" />
        <input name="category" placeholder="Catégorie" className="border p-2 rounded" />
        <button className="bg-black text-white px-4 rounded">Filtrer</button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(documents as DocumentRow[] ?? []).map((doc) => (
          <DocumentCard key={doc.id} doc={doc} locked={doc.is_premium && !premium} />
        ))}
      </div>
    </main>
  );
}
