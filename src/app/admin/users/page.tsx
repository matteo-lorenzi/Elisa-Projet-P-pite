import { createClient } from '@/lib/supabase/server';
import { buttonClass } from '@/components/ui';
import { setUserRole } from './actions';
import type { Profile, Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

const control =
  'rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted transition focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

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

  const stats = [
    { label: 'Comptes', value: all.length },
    { label: 'Abonnés actifs', value: all.filter((r) => subStatus(r) === 'active').length },
    { label: 'Inscrits newsletter', value: all.filter((r) => r.newsletter_opt_in).length },
  ];

  return (
    <main>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
        Utilisateurs
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius)] border border-border bg-surface p-4"
          >
            <div className="font-display text-2xl font-semibold text-foreground">
              {s.value}
            </div>
            <div className="mt-0.5 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium text-foreground">
            Rechercher
          </label>
          <input id="q" name="q" defaultValue={q ?? ''} placeholder="Adresse e-mail" className={control} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            Rôle
          </label>
          <select id="role" name="role" defaultValue={role ?? ''} className={control}>
            <option value="">Tous</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-foreground">
            Abonnement
          </label>
          <select id="status" name="status" defaultValue={status ?? ''} className={control}>
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="past_due">Impayé</option>
            <option value="none">Aucun</option>
          </select>
        </div>
        <button type="submit" className={buttonClass({ size: 'sm' })}>
          Filtrer
        </button>
        <a href="/api/admin/users/export" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          Export CSV
        </a>
      </form>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius)] border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-muted">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Abonnement</th>
              <th className="px-4 py-3 font-medium">Newsletter</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
              <th className="px-4 py-3">
                <span className="sr-only">Modifier le rôle</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{p.email}</td>
                <td className="px-4 py-3 text-muted">{p.role}</td>
                <td className="px-4 py-3 text-muted">{subStatus(p) ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{p.newsletter_opt_in ? 'Oui' : '—'}</td>
                <td className="px-4 py-3 text-muted">
                  {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  <form action={setUserRole} className="flex items-center justify-end gap-2">
                    <input type="hidden" name="userId" value={p.id} />
                    <label htmlFor={`role-${p.id}`} className="sr-only">
                      Rôle de {p.email}
                    </label>
                    <select
                      id={`role-${p.id}`}
                      name="role"
                      defaultValue={p.role}
                      className={control}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button type="submit" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                      OK
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-muted">Aucun utilisateur ne correspond.</p>
      )}
    </main>
  );
}
