import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { canViewDocumentFile } from '@/lib/access';
import { PdfViewer } from '@/components/PdfViewer';
import type { Profile, SubscriptionRow, DocumentRow } from '@/lib/supabase/types';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  const { data: doc } = await supabase
    .from('documents').select('*').eq('id', id).single();

  if (!doc) redirect('/bibliotheque');

  const allowed = canViewDocumentFile(
    profile as Profile,
    subscription as SubscriptionRow | null,
    doc as DocumentRow,
  );

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/bibliotheque" className="text-sm underline">← Bibliothèque</Link>
      <h1 className="mt-2 text-2xl font-bold">{(doc as DocumentRow).title}</h1>
      {(doc as DocumentRow).author && (
        <p className="text-sm text-gray-600">Par {(doc as DocumentRow).author}</p>
      )}
      {(doc as DocumentRow).description && (
        <p className="mt-2">{(doc as DocumentRow).description}</p>
      )}
      <div className="mt-6">
        {allowed ? (
          <PdfViewer docId={(doc as DocumentRow).id} type={(doc as DocumentRow).type} />
        ) : (
          <div className="rounded border bg-gray-50 p-8 text-center">
            <p className="text-lg">🔒 Ce document est réservé aux abonnés.</p>
            <p className="mt-2 text-sm text-gray-600">
              L&apos;abonnement sera disponible prochainement.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
