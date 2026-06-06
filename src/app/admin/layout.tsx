import { createClient } from '@/lib/supabase/server';
import { requireAdminPage } from '@/lib/auth/admin';
import { AdminNav } from '@/components/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  await requireAdminPage(supabase);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Administration
        </p>
        <AdminNav />
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
