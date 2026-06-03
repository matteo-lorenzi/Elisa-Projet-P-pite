import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasPremiumAccess } from '@/lib/access';
import { DocumentCard } from '@/components/DocumentCard';
import type { DocumentRow, Profile, SubscriptionRow } from '@/lib/supabase/types';

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();

  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (q) query = query.ilike('title', `%${q}%`);
  const { data: documents } = await query;

  const premium = hasPremiumAccess(profile as Profile, subscription as SubscriptionRow | null);

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
