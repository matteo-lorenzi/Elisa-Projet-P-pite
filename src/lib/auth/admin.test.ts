import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../supabase/types';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    // Next.js fait jeter redirect() pour stopper le flux ; on imite.
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { redirect } from 'next/navigation';
import { loadAdmin, requireAdminAction, requireAdminApi, requireAdminPage } from './admin';

const adminProfile: Profile = {
  id: 'u1', email: 'admin@b.fr', full_name: null, display_name: null,
  role: 'admin', newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z',
};
const freeProfile: Profile = { ...adminProfile, id: 'u2', role: 'free' };

const fakeClient = (opts: {
  user: { id: string } | null;
  profile: Profile | null;
}): SupabaseClient =>
  ({
    auth: { getUser: async () => ({ data: { user: opts.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: opts.profile }),
        }),
      }),
    }),
  }) as unknown as SupabaseClient;

beforeEach(() => {
  vi.mocked(redirect).mockClear();
});

describe('loadAdmin', () => {
  it('aucun utilisateur connecté → unauthenticated', async () => {
    const r = await loadAdmin(fakeClient({ user: null, profile: null }));
    expect(r).toEqual({ ok: false, reason: 'unauthenticated' });
  });

  it('utilisateur connecté mais rôle non admin → forbidden', async () => {
    const r = await loadAdmin(fakeClient({ user: { id: 'u2' }, profile: freeProfile }));
    expect(r).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('profil introuvable → forbidden', async () => {
    const r = await loadAdmin(fakeClient({ user: { id: 'u2' }, profile: null }));
    expect(r).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('utilisateur admin → ok + profil', async () => {
    const r = await loadAdmin(fakeClient({ user: { id: 'u1' }, profile: adminProfile }));
    expect(r).toEqual({ ok: true, profile: adminProfile });
  });
});

describe('requireAdminAction', () => {
  it('admin → renvoie le profil', async () => {
    const me = await requireAdminAction(fakeClient({ user: { id: 'u1' }, profile: adminProfile }));
    expect(me).toEqual(adminProfile);
  });

  it('non authentifié → throw "non authentifié"', async () => {
    await expect(
      requireAdminAction(fakeClient({ user: null, profile: null })),
    ).rejects.toThrow('non authentifié');
  });

  it('non admin → throw "accès refusé"', async () => {
    await expect(
      requireAdminAction(fakeClient({ user: { id: 'u2' }, profile: freeProfile })),
    ).rejects.toThrow('accès refusé');
  });
});

describe('requireAdminApi', () => {
  it('admin → renvoie le profil', async () => {
    const me = await requireAdminApi(fakeClient({ user: { id: 'u1' }, profile: adminProfile }));
    expect(me).toEqual(adminProfile);
  });

  it('non authentifié → Response 401', async () => {
    const r = await requireAdminApi(fakeClient({ user: null, profile: null }));
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(401);
  });

  it('non admin → Response 403', async () => {
    const r = await requireAdminApi(fakeClient({ user: { id: 'u2' }, profile: freeProfile }));
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(403);
  });
});

describe('requireAdminPage', () => {
  it('admin → renvoie le profil, pas de redirect', async () => {
    const me = await requireAdminPage(fakeClient({ user: { id: 'u1' }, profile: adminProfile }));
    expect(me).toEqual(adminProfile);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('non authentifié → redirect /login', async () => {
    await expect(
      requireAdminPage(fakeClient({ user: null, profile: null })),
    ).rejects.toThrow('REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('non admin → redirect /bibliotheque', async () => {
    await expect(
      requireAdminPage(fakeClient({ user: { id: 'u2' }, profile: freeProfile })),
    ).rejects.toThrow('REDIRECT:/bibliotheque');
    expect(redirect).toHaveBeenCalledWith('/bibliotheque');
  });
});
