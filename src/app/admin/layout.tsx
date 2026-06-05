import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/bibliotheque');

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
