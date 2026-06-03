import { signUp } from '@/app/auth/actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Inscription</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form action={signUp} className="mt-4 flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Email"
          className="border p-2 rounded" />
        <input name="password" type="password" required minLength={6}
          placeholder="Mot de passe" className="border p-2 rounded" />
        <button className="bg-black text-white p-2 rounded">Créer mon compte</button>
      </form>
      <p className="mt-4 text-sm">
        Déjà un compte ? <a href="/login" className="underline">Se connecter</a>
      </p>
    </main>
  );
}
