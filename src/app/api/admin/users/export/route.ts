import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function csvField(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  // Re-check admin (pas seulement le layout — c'est une route directe).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('non authentifié', { status: 401 });
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return new Response('accès refusé', { status: 403 });

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
