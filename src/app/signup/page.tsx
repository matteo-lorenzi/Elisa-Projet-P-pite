import Link from 'next/link';
import { signUp } from '@/app/auth/actions';
import { Banner, Button, CheckboxField, TextField } from '@/components/ui';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
        Créer un compte
      </h1>
      <p className="mt-2 text-muted">
        Quelques secondes pour accéder aux documents et aux schémas.
      </p>

      {error && (
        <Banner tone="danger" className="mt-6">
          {error}
        </Banner>
      )}

      <form action={signUp} className="mt-8 flex flex-col gap-5">
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
          autoComplete="new-password"
          required
          minLength={6}
          hint="6 caractères minimum."
          placeholder="••••••••"
        />
        <CheckboxField
          name="newsletter"
          value="on"
          label="Recevoir la newsletter (désinscription possible à tout moment)"
        />
        <Button type="submit" className="mt-1 w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Déjà inscrit ?{' '}
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Se connecter
        </Link>
      </p>
    </main>
  );
}
