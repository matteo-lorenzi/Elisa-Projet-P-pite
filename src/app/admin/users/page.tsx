import { createClient } from '@/lib/supabase/server';
import { setUserRole } from './actions';
import type { Profile, Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

export default async function AdminUsersPage() {
  const supabase = await createClient();
  // La garde admin est dans src/app/admin/layout.tsx ; RLS laisse l'admin tout lire.
  const { data: profiles } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: true });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Email</th><th>Rôle</th><th></th>
          </tr>
        </thead>
        <tbody>
          {(profiles as Profile[] ?? []).map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-2">{p.email}</td>
              <td>{p.role}</td>
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
