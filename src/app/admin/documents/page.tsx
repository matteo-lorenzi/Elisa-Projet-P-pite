import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { DocumentRow } from '@/lib/supabase/types';

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from('documents').select('*').order('created_at', { ascending: false });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        <Link href="/admin/documents/new" className="bg-black text-white px-3 py-1 rounded text-sm">
          + Nouveau
        </Link>
      </div>
      <ul className="mt-4 divide-y">
        {(documents as DocumentRow[] ?? []).map((d) => (
          <li key={d.id} className="py-2 flex justify-between">
            <span>{d.title}</span>
            <span className="text-sm text-gray-500">
              {d.is_premium ? 'Premium' : 'Gratuit'} · {d.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
