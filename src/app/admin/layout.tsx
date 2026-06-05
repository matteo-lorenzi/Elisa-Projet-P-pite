import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminPage } from '@/lib/auth/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  await requireAdminPage(supabase);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <nav className="mb-6 flex gap-4 border-b pb-2 text-sm">
        <Link href="/admin/documents" className="underline">Documents</Link>
        <Link href="/admin/users" className="underline">Utilisateurs</Link>
        <Link href="/admin/newsletter" className="underline">Newsletter</Link>
      </nav>
      {children}
    </div>
  );
}
