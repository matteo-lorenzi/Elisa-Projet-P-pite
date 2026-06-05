import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { verify } from '@/lib/newsletter-token';

function html(body: string): Response {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
     <meta name="viewport" content="width=device-width,initial-scale=1" />
     <title>Désinscription</title></head>
     <body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">
     ${body}</body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const userId = verify(token);
  if (!userId) {
    return html('<h1>Lien invalide</h1><p>Ce lien de désinscription n\'est pas valide.</p>');
  }
  const adminDb = createServiceRoleClient();
  const { error } = await adminDb
    .from('profiles').update({ newsletter_opt_in: false }).eq('id', userId);
  if (error) {
    return html('<h1>Erreur</h1><p>Réessayez plus tard.</p>');
  }
  return html('<h1>Désinscription confirmée</h1><p>Vous ne recevrez plus la newsletter.</p>');
}
