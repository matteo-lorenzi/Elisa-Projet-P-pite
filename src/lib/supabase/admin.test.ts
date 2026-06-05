import { describe, it, expect, afterEach } from 'vitest';
import { createServiceRoleClient } from './admin';

const URL = 'https://example.supabase.co';
const KEY = 'service-role-key';
const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  if (origUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (origKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('createServiceRoleClient', () => {
  it('throw explicite si URL Supabase manquante', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    expect(() => createServiceRoleClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('throw explicite si clé service-role manquante', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createServiceRoleClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('renvoie un client Supabase quand les deux variables sont présentes', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    const client = createServiceRoleClient();
    expect(typeof client.from).toBe('function');
  });
});
