import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/auth/admin';

function csvField(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  // Re-check admin (pas seulement le layout — c'est une route directe).
  const supabase = await createClient();
  const guard = await requireAdminApi(supabase);
  if (guard instanceof Response) return guard;

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await adminDb
    .from('profiles')
    .select('email, role, newsletter_opt_in, created_at, subscriptions(status)')
    .order('created_at', { ascending: true });

  type Row = {
    email: string; role: string; newsletter_opt_in: boolean;
    created_at: string; subscriptions: { status: string | null } | null;
  };
  const rows = (data as Row[] | null) ?? [];

  const header = ['email', 'role', 'abonnement', 'newsletter', 'inscrit_le'];
  const lines = rows.map((r) => [
    r.email,
    r.role,
    r.subscriptions?.status ?? '',
    r.newsletter_opt_in ? 'oui' : 'non',
    r.created_at,
  ].map(csvField).join(','));
  const csv = [header.map(csvField).join(','), ...lines].join('\r\n');

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="utilisateurs.csv"',
    },
  });
}
