import Link from 'next/link';
import type { Metadata } from 'next';
import { buttonClass } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Tarifs — Vulgarisation du droit rural',
  description:
    'Un accès gratuit aux documents libres, un abonnement premium à 9,90 €/mois pour toute la bibliothèque.',
};

type Plan = {
  name: string;
  price: string;
  period?: string;
  lead: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Gratuit',
    price: '0 €',
    lead: 'Pour découvrir et suivre l’essentiel.',
    features: [
      'Les documents en accès libre',
      'Les schémas clairs publiés',
      'La newsletter du droit rural',
    ],
    cta: { label: 'Créer un compte', href: '/signup' },
  },
  {
    name: 'Premium',
    price: '9,90 €',
    period: '/ mois',
    lead: 'Toute la bibliothèque, sans engagement.',
    features: [
      'Tous les documents, premium compris',
      'Tous les schémas (baux, préemption, transmission)',
      'La newsletter du droit rural',
      'Résiliation à tout moment',
    ],
    cta: { label: 'S’abonner', href: '/abonnement' },
    featured: true,
  },
];

export default function TarifsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">
          Un tarif simple, pensé pour le terrain
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Commencez gratuitement. Passez en premium quand vous voulez l’accès
          complet aux documents et aux schémas.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {PLANS.map((plan) => (
          <section
            key={plan.name}
            className={`flex flex-col rounded-[var(--radius)] border p-6 ${
              plan.featured
                ? 'border-accent bg-surface'
                : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {plan.name}
              </h2>
              {plan.featured && (
                <span className="rounded-[var(--radius)] border border-accent px-2 py-0.5 text-xs font-medium text-accent">
                  Recommandé
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                {plan.price}
              </span>
              {plan.period && <span className="text-muted">{plan.period}</span>}
            </div>
            <p className="mt-2 text-muted">{plan.lead}</p>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-foreground">
                  <span aria-hidden="true" className="mt-0.5 text-accent">
                    ✓
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.cta.href}
              className={buttonClass({
                variant: plan.featured ? 'primary' : 'secondary',
                className: 'mt-8 w-full',
              })}
            >
              {plan.cta.label}
            </Link>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Déjà inscrit ?{' '}
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Se connecter
        </Link>
      </p>
    </main>
  );
}
