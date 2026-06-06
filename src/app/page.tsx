import Link from 'next/link';

// Home vitrine VulgaRuRale. Identité: docs/design/identite.md (éditorial documentaire,
// accent ardoise, le SCHÉMA est la signature de marque). Tokens via globals.css.

export default function Home() {
  return (
    <main>
      {/* ── Hero : copy + schéma signature. Stack mobile, split ≥ lg. ────────── */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="text-balance font-display text-display font-semibold leading-[1.05] tracking-tight">
              Le droit rural, traduit pour le terrain.
            </h1>
            <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-muted">
              Documents pédagogiques, schémas clairs et newsletter pour décider
              vite, sans jargon juridique. Pensé pour les exploitants et leurs
              conseillers.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/bibliotheque"
                className="inline-flex items-center justify-center rounded-[var(--radius)] bg-accent px-5 py-3 font-medium text-accent-ink transition hover:opacity-90 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Accéder à la bibliothèque
              </Link>
              <Link
                href="/abonnement"
                className="inline-flex items-center justify-center rounded-[var(--radius)] border border-border px-5 py-3 font-medium text-foreground transition hover:bg-surface active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Voir l&rsquo;abonnement
              </Link>
            </div>
          </div>

          <figure className="text-foreground">
            <HeroSchema />
            <figcaption className="mt-3 text-sm text-muted">
              Exemple : ce qu&rsquo;encadre un bail rural, d&rsquo;un coup d&rsquo;œil.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Offre : liste divisée, pas de cartes répétées. 3-col ≥ md. ───────── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Ce que vous trouvez ici
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border md:grid-cols-3">
            <Offering
              title="Documents pédagogiques"
              body="Chaque notion juridique traduite en langage de terrain, avec des exemples concrets d'exploitation."
            />
            <Offering
              title="Schémas clairs"
              body="Baux, préemption, transmission : les mécanismes rendus visibles, pas décrits en dix pages."
            />
            <Offering
              title="Newsletter"
              body="Les évolutions du droit rural qui changent votre quotidien, résumées et expliquées."
            />
          </div>
        </div>
      </section>

      {/* ── Showcase : le schéma comme signature, full-width centré. ─────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Un schéma vaut mieux qu&rsquo;un article de loi
          </h2>
          <p className="mx-auto mt-4 max-w-[60ch] text-lg leading-relaxed text-muted">
            Notre signature : transformer une règle complexe en parcours lisible.
            Voici comment se transmet une exploitation agricole.
          </p>
          <div className="mt-12 text-foreground">
            <TransmissionSchema />
          </div>
        </div>
      </section>

      {/* ── Bande CTA finale. Stack mobile, ligne ≥ sm. ──────────────────────── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Pour les exploitants et leurs conseillers
            </h2>
            <p className="mt-2 max-w-[50ch] text-muted">
              Comprenez votre situation avant d&rsquo;agir, sans payer une
              consultation pour chaque question.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-[var(--radius)] bg-accent px-5 py-3 font-medium text-accent-ink transition hover:opacity-90 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Créer un compte
            </Link>
            <Link
              href="/bibliotheque"
              className="inline-flex items-center justify-center rounded-[var(--radius)] border border-border px-5 py-3 font-medium text-foreground transition hover:bg-background active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Parcourir la bibliothèque
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Offering({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-surface p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted">{body}</p>
    </div>
  );
}

/* Schéma signature (hero) : ce qu'encadre un bail rural.
   Monochrome via currentColor + un nœud accent. Rend en clair et sombre. */
function HeroSchema() {
  return (
    <svg
      viewBox="0 0 360 250"
      role="img"
      aria-label="Schéma : un bail rural encadre la durée, le droit de préemption et la résiliation."
      className="w-full"
    >
      {/* connecteurs */}
      <g className="stroke-[var(--p-ink)] opacity-30" strokeWidth={1.5} fill="none">
        <path d="M180 70 V100 M60 100 H300 M60 100 V128 M180 100 V128 M300 100 V128" />
      </g>
      {/* nœud racine (accent) */}
      <g>
        <rect x="110" y="24" width="140" height="46" rx="10" className="fill-[var(--p-accent)]" />
        <text x="180" y="52" textAnchor="middle" className="fill-[var(--p-accent-ink)] font-display text-[15px] font-semibold">
          Bail rural
        </text>
      </g>
      {/* branches */}
      <SchemaLeaf x={15} y={128} label="Durée : 9 ans" />
      <SchemaLeaf x={135} y={128} label="Préemption" />
      <SchemaLeaf x={255} y={128} label="Résiliation" />
    </svg>
  );
}

function SchemaLeaf({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width="90" height="44" rx="10" className="fill-[var(--p-surface)] stroke-[var(--p-border)]" strokeWidth={1.5} />
      <text x={x + 45} y={y + 27} textAnchor="middle" className="fill-[var(--p-ink)] text-[12px]">
        {label}
      </text>
    </g>
  );
}

/* Showcase : transmission d'une exploitation. Deux niveaux de branches. */
function TransmissionSchema() {
  return (
    <svg
      viewBox="0 0 680 320"
      role="img"
      aria-label="Schéma : une exploitation agricole se transmet par vente, par bail rural (ouvrant un droit de préemption du fermier) ou par succession (avec reprise par un héritier)."
      className="mx-auto w-full max-w-2xl"
    >
      <g className="stroke-[var(--p-ink)] opacity-30" strokeWidth={1.5} fill="none">
        {/* racine vers niveau 1 */}
        <path d="M340 66 V96 M120 96 H560 M120 96 V124 M340 96 V124 M560 96 V124" />
        {/* niveau 1 vers niveau 2 */}
        <path d="M340 168 V200 M560 168 V200" />
      </g>

      {/* racine accent */}
      <rect x="250" y="20" width="180" height="46" rx="10" className="fill-[var(--p-accent)]" />
      <text x="340" y="48" textAnchor="middle" className="fill-[var(--p-accent-ink)] font-display text-[15px] font-semibold">
        Exploitation agricole
      </text>

      {/* niveau 1 */}
      <ShowcaseNode x={50} y={124} w={140} label="Vente" />
      <ShowcaseNode x={270} y={124} w={140} label="Bail rural" />
      <ShowcaseNode x={490} y={124} w={140} label="Succession" />

      {/* niveau 2 */}
      <ShowcaseNode x={250} y={200} w={180} label="Préemption du fermier" muted />
      <ShowcaseNode x={470} y={200} w={180} label="Reprise par un héritier" muted />
    </svg>
  );
}

function ShowcaseNode({
  x,
  y,
  w,
  label,
  muted = false,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  muted?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height="44"
        rx="10"
        className={muted ? 'fill-[var(--p-paper)] stroke-[var(--p-border)]' : 'fill-[var(--p-surface)] stroke-[var(--p-border)]'}
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={y + 27}
        textAnchor="middle"
        className={muted ? 'fill-[var(--p-muted)] text-[12px]' : 'fill-[var(--p-ink)] text-[13px] font-medium'}
      >
        {label}
      </text>
    </g>
  );
}
