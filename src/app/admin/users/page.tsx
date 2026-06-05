import { createClient } from '@/lib/supabase/server';
import { setUserRole } from './actions';
import type { Profile, Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

type Row = Profile & { subscriptions: { status: string | null } | null };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const { q, role, status } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*, subscriptions(status)')
    .order('created_at', { ascending: true });

  const all = (data as Row[] | null) ?? [];
  const subStatus = (r: Row) => r.subscriptions?.status ?? null;

  const filtered = all.filter((r) => {
    if (q && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
    if (role && r.role !== role) return false;
    if (status === 'active' && subStatus(r) !== 'active') return false;
    if (status === 'past_due' && subStatus(r) !== 'past_due') return false;
    if (status === 'none' && subStatus(r)) return false;
    return true;
  });

  const total = all.length;
  const activeSubs = all.filter((r) => subStatus(r) === 'active').length;
  const newsletter = all.filter((r) => r.newsletter_opt_in).length;

  return (
    <main>
      <h1 className="text-2xl font-bold">Utilisateurs</h1>

      <div className="mt-3 flex gap-4 text-sm">
        <span>Total : <strong>{total}</strong></span>
        <span>Abonnés actifs : <strong>{activeSubs}</strong></span>
        <span>Inscrits newsletter : <strong>{newsletter}</strong></span>
      </div>

      <form className="mt-4 flex flex-wrap gap-2 text-sm" method="get">
        <input name="q" defaultValue={q ?? ''} placeholder="Rechercher email"
          className="border p-1 rounded" />
        <select name="role" defaultValue={role ?? ''} className="border p-1 rounded">
          <option value="">Tous rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ''} className="border p-1 rounded">
          <option value="">Tout abonnement</option>
          <option value="active">active</option>
          <option value="past_due">past_due</option>
          <option value="none">aucun</option>
        </select>
        <button className="rounded border px-3">Filtrer</button>
        <a href="/api/admin/users/export" className="rounded border px-3 py-1">Export CSV</a>
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Email</th><th>Rôle</th><th>Abonnement</th>
            <th>Newsletter</th><th>Inscrit le</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-2">{p.email}</td>
              <td>{p.role}</td>
              <td>{subStatus(p) ?? '—'}</td>
              <td>{p.newsletter_opt_in ? '✓' : '—'}</td>
              <td>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
              <td>
                <form action={setUserRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={p.id} />
                  <select name="role" defaultValue={p.role} className="border p-1 rounded">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="rounded bg-black px-3 text-white">OK</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
