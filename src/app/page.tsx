import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Vulgarisation du droit rural</h1>
      <p className="mt-4 text-gray-600">
        Documents pédagogiques, schémas et newsletter pour comprendre le droit rural.
      </p>
      <Link href="/bibliotheque" className="mt-6 inline-block underline">
        Accéder à la bibliothèque
      </Link>
    </main>
  );
}
