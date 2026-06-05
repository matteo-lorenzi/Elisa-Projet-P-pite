import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { buildEmailHtml } from './newsletter-email';

beforeAll(() => {
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'secret-de-test';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://site.test';
});

describe('buildEmailHtml', () => {
  it('insère le corps et un lien de désinscription tokenisé', () => {
    const html = buildEmailHtml('<p>Bonjour</p>', 'user-123');
    expect(html).toContain('<p>Bonjour</p>');
    expect(html).toContain('/api/newsletter/unsubscribe?token=user-123.');
    expect(html).toContain('https://site.test');
  });
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://site.test';
});

describe('buildEmailHtml — garde-fou URL', () => {
  it('throw si NEXT_PUBLIC_SITE_URL est absent', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(() => buildEmailHtml('<p>x</p>', 'u1')).toThrow('NEXT_PUBLIC_SITE_URL');
  });
});
