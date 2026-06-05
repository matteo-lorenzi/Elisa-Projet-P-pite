import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/auth/viewer';
import { setNewsletterOptIn } from './actions';

export default async function ProfilPage() {
  const supabase = await createClient();
  const { profile } = await requireViewer(supabase);

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <p className="mt-2 text-sm text-gray-600">{profile?.email}</p>
      <form action={setNewsletterOptIn} className="mt-6 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="newsletter"
            value="on"
            defaultChecked={profile?.newsletter_opt_in ?? false}
          />
          Recevoir la newsletter
        </label>
        <button className="rounded bg-black px-3 py-2 text-white">Enregistrer</button>
      </form>
    </main>
  );
}
