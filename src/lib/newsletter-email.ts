import { sign } from './newsletter-token';

/** Compose le HTML final d'un email pour un destinataire (corps + pied désinscription). */
export function buildEmailHtml(bodyHtml: string, userId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const url = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(sign(userId))}`;
  return `${bodyHtml}
<hr style="margin-top:32px;border:none;border-top:1px solid #ddd" />
<p style="font-size:12px;color:#888">
  Vous recevez cet email car vous êtes inscrit à la newsletter.
  <a href="${url}">Se désinscrire</a>.
</p>`;
}
