import { createHmac, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const s = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!s) throw new Error('NEWSLETTER_UNSUBSCRIBE_SECRET manquant');
  return s;
}

function hmac(userId: string): string {
  return createHmac('sha256', secret()).update(userId).digest('hex');
}

/** Construit un token de désinscription "<userId>.<hmac>". */
export function sign(userId: string): string {
  return `${userId}.${hmac(userId)}`;
}

/** Vérifie un token ; renvoie le userId si valide, sinon null. */
export function verify(token: string): string | null {
  const idx = token.lastIndexOf('.');
  if (idx <= 0 || idx === token.length - 1) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = hmac(userId);
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}
