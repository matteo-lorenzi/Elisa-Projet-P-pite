import type { Metadata } from 'next';
import { Bricolage_Grotesque, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SiteNavLinks } from '@/components/SiteNavLinks';

// Applique le thème stocké avant le premier paint (évite le flash clair→sombre).
const noFlashTheme = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

// Identité: display + corps (voir docs/design/identite.md). Variables consommées par @theme dans globals.css.
const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});
const fontSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
});

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
    <html lang="fr" className={`${fontDisplay.variable} ${fontSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body suppressHydrationWarning>
        <header className="border-b border-border">
          <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 text-sm">
            <Link href="/" className="font-display text-base font-semibold tracking-tight">
              VulgaRuRale
            </Link>
            <div className="flex items-center gap-5">
              <SiteNavLinks isAdmin={isAdmin} />
              {user ? (
                <form action={signOut}><button className="text-muted transition hover:text-foreground">Déconnexion</button></form>
              ) : (
                <Link href="/login" className="font-medium text-accent transition hover:opacity-80">Connexion</Link>
              )}
              <ThemeToggle />
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
