import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export const metadata: Metadata = {
  title: 'Vulgarisation du droit rural',
  description: 'Documents pédagogiques, schémas et newsletter pour comprendre le droit rural.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'admin';
  }
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="border-b">
          <nav className="mx-auto flex max-w-4xl items-center justify-between p-4 text-sm">
            <Link href="/" className="font-bold">Droit rural</Link>
            <div className="flex items-center gap-4">
              <Link href="/bibliotheque" className="underline">Bibliothèque</Link>
              {isAdmin && <Link href="/admin/documents" className="underline">Admin</Link>}
              {user ? (
                <form action={signOut}><button className="underline">Déconnexion</button></form>
              ) : (
                <Link href="/login" className="underline">Connexion</Link>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
