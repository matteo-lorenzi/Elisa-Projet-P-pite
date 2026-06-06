import Link from 'next/link';
import { signIn } from '@/app/auth/actions';
import { Banner, Button, TextField } from '@/components/ui';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
        Connexion
      </h1>
      <p className="mt-2 text-muted">
        Accédez à la bibliothèque et à votre abonnement.
      </p>

      {error && (
        <Banner tone="danger" className="mt-6">
          {error}
        </Banner>
      )}

      <form action={signIn} className="mt-8 flex flex-col gap-5">
        <TextField
          name="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exploitation.fr"
        />
        <TextField
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        <Button type="submit" className="mt-1 w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link
          href="/signup"
          className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
