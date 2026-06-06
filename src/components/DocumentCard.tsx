import Link from 'next/link';
import type { DocumentRow } from '@/lib/supabase/types';

export function DocumentCard({ doc, locked }: { doc: DocumentRow; locked: boolean }) {
  return (
    <Link
      href={`/bibliotheque/${doc.id}`}
      className="group flex flex-col rounded-[var(--radius)] border border-border bg-surface p-5 transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display font-semibold leading-snug text-foreground">
          {doc.title}
        </h2>
        {doc.is_premium && (
          <span
            className={`shrink-0 rounded-[var(--radius)] border px-2 py-0.5 text-xs font-medium ${
              locked
                ? 'border-border text-muted'
                : 'border-accent text-accent'
            }`}
          >
            {locked ? 'Premium' : 'Inclus'}
          </span>
        )}
      </div>
      {doc.description && (
        <p className="mt-2 line-clamp-3 text-sm text-muted">{doc.description}</p>
      )}
      {doc.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {doc.tags.map((t) => (
            <span
              key={t}
              className="rounded-[var(--radius)] border border-border bg-background px-2 py-0.5 text-xs text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
