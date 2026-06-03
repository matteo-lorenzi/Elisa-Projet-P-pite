'use client';

import { useEffect, useState } from 'react';
import type { DocumentType } from '@/lib/supabase/types';

export function PdfViewer({ docId, type }: { docId: string; type: DocumentType }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${docId}/url`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setUrl(d.url))
      .catch((e) => setError(String(e)));
  }, [docId]);

  if (error) return <p className="text-red-600">Impossible de charger le document.</p>;
  if (!url) return <p>Chargement…</p>;
  if (type === 'schema') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="Schéma" className="max-w-full rounded border" />;
  }
  return <object data={url} type="application/pdf" className="h-[80vh] w-full rounded border" />;
}
