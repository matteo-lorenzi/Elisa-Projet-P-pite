import Link from 'next/link';
import type { DocumentRow } from '@/lib/supabase/types';

export function DocumentCard({ doc, locked }: { doc: DocumentRow; locked: boolean }) {
  return (
    <Link
      href={`/bibliotheque/${doc.id}`}
      className="block rounded border p-4 hover:shadow"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{doc.title}</h2>
        {doc.is_premium && (
          <span className="text-sm">{locked ? '🔒 Premium' : '✓ Premium'}</span>
        )}
      </div>
      {doc.description && <p className="mt-1 text-sm text-gray-600">{doc.description}</p>}
      {doc.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {doc.tags.map((t) => (
            <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
