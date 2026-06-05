import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { hasPremiumAccess } from '@/lib/access';
import { createCheckoutSession, createPortalSession } from './actions';

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const { success, canceled } = await searchParams;
  const supabase = await createClient();
  const { profile, subscription: sub } = await requireViewer(supabase);
  const premium = hasPremiumAccess(profile, sub);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/bibliotheque" className="text-sm underline">← Bibliothèque</Link>
      <h1 className="mt-2 text-2xl font-bold">Abonnement</h1>

      {success && (
        <p className="mt-4 rounded bg-green-50 p-3 text-green-800">
          Paiement confirmé. Votre accès premium peut prendre quelques secondes à s’activer.
        </p>
      )}
      {canceled && (
        <p className="mt-4 rounded bg-gray-50 p-3 text-gray-700">Paiement annulé.</p>
      )}
      {sub?.status === 'past_due' && (
        <p className="mt-4 rounded bg-amber-50 p-3 text-amber-800">
          Votre dernier paiement a échoué. Régularisez-le pour conserver l’accès premium.
        </p>
      )}

      {premium ? (
        <section className="mt-6">
          <p className="text-lg">✓ Vous avez accès à l’ensemble des documents.</p>
          {sub?.stripe_customer_id && (
            <form action={createPortalSession} className="mt-4">
              <button className="rounded bg-black px-4 py-2 text-white">
                Gérer mon abonnement
              </button>
            </form>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <p>Débloquez tous les documents premium pour 9,90 €/mois.</p>
          <form action={createCheckoutSession} className="mt-4">
            <button className="rounded bg-black px-4 py-2 text-white">S’abonner</button>
          </form>
        </section>
      )}
    </main>
  );
}
