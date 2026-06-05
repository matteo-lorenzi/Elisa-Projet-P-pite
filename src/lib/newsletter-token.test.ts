import { describe, it, expect, beforeAll } from 'vitest';
import { sign, verify } from './newsletter-token';

beforeAll(() => {
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'secret-de-test';
});

describe('newsletter-token', () => {
  it('aller-retour sign/verify rend le userId', () => {
    const token = sign('user-123');
    expect(verify(token)).toBe('user-123');
  });

  it('rejette un token falsifié (mauvaise signature)', () => {
    const token = sign('user-123');
    const falsifie = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verify(falsifie)).toBeNull();
  });

  it('rejette un token sans point / tronqué', () => {
    expect(verify('pasdepoint')).toBeNull();
    expect(verify('user-123.')).toBeNull();
    expect(verify('')).toBeNull();
  });

  it('rejette un userId substitué (signature ne matche plus)', () => {
    const token = sign('user-123');
    const sig = token.split('.')[1];
    expect(verify(`autre-user.${sig}`)).toBeNull();
  });
});
