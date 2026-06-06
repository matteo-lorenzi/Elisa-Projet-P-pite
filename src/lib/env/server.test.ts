import { describe, it, expect, afterEach } from 'vitest';
import { env } from './server';

const TOUCHED = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY'] as const;
const orig = Object.fromEntries(TOUCHED.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of TOUCHED) {
    if (orig[k] === undefined) delete process.env[k];
    else process.env[k] = orig[k];
  }
});

describe('env (server)', () => {
  it('renvoie la valeur quand la variable est présente', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_123');
  });

  it('throw « manquant » quand la variable est absente', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => env.STRIPE_SECRET_KEY).toThrow(/STRIPE_SECRET_KEY manquant/);
  });

  it('traite une chaîne vide comme manquante', () => {
    process.env.RESEND_API_KEY = '';
    expect(() => env.RESEND_API_KEY).toThrow(/RESEND_API_KEY manquant/);
  });
});
