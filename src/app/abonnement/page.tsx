import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { hasPremiumAccess } from '@/lib/access';
import { Banner, Button } from '@/components/ui';
import { createCheckoutSession, createPortalSession } from './actions';

const INCLUS = [
  'Tous les documents pédagogiques, premium compris',
  'Les schémas clairs (baux, préemption, transmission)',
  'La newsletter des évolutions du droit rural',
];

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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/bibliotheque"
        className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span> Bibliothèque
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance">
        Abonnement
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        {success && (
          <Banner tone="success">
            Paiement confirmé. Votre accès premium peut prendre quelques secondes
            à s’activer.
          </Banner>
        )}
        {canceled && <Banner tone="info">Paiement annulé.</Banner>}
        {sub?.status === 'past_due' && (
          <Banner tone="warning">
            Votre dernier paiement a échoué. Régularisez-le pour conserver l’accès
            premium.
          </Banner>
        )}
      </div>

      {premium ? (
        <section className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-6">
          <p className="font-display text-lg font-semibold text-foreground">
            Vous avez accès à l’ensemble des documents.
          </p>
          <p className="mt-1 text-muted">
            Merci de soutenir la vulgarisation du droit rural.
          </p>
          {sub?.stripe_customer_id && (
            <form action={createPortalSession} className="mt-5">
              <Button type="submit" variant="secondary">
                Gérer mon abonnement
              </Button>
            </form>
          )}
        </section>
      ) : (
        <section className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-6">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
              9,90 €
            </span>
            <span className="text-muted">/ mois</span>
          </div>
          <p className="mt-2 text-muted">
            Débloquez l’ensemble des documents premium. Sans engagement.
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {INCLUS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-foreground">
                <span aria-hidden="true" className="mt-0.5 text-accent">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <form action={createCheckoutSession} className="mt-6">
            <Button type="submit">S’abonner</Button>
          </form>
        </section>
      )}
    </main>
  );
}
