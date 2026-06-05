import { describe, it, expect } from 'vitest';
import { readEnv, REQUIRED_ENV } from './env';

const complete = (): Record<string, string> =>
  Object.fromEntries(REQUIRED_ENV.map((k) => [k, `val-${k}`]));

describe('readEnv', () => {
  it('renvoie toutes les variables quand elles sont présentes', () => {
    const env = readEnv(complete());
    expect(env.STRIPE_PRICE_ID).toBe('val-STRIPE_PRICE_ID');
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('val-NEXT_PUBLIC_SITE_URL');
  });

  it('throw en listant toutes les variables manquantes', () => {
    const source = complete();
    delete source.RESEND_API_KEY;
    delete source.STRIPE_WEBHOOK_SECRET;
    let message = '';
    try {
      readEnv(source);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/RESEND_API_KEY/);
    expect(message).toMatch(/STRIPE_WEBHOOK_SECRET/);
  });

  it('traite une chaîne vide comme manquante', () => {
    const source = complete();
    source.NEWSLETTER_FROM = '';
    expect(() => readEnv(source)).toThrow(/NEWSLETTER_FROM/);
  });
});
