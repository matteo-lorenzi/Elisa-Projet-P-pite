import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, SubscriptionRow } from '../supabase/types';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { redirect } from 'next/navigation';
import { getViewer, requireViewer } from './viewer';

const profile: Profile = {
  id: 'u1', email: 'a@b.fr', full_name: null, display_name: null,
  role: 'free', newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z',
};
const subscription: SubscriptionRow = {
  user_id: 'u1', stripe_customer_id: null, stripe_subscription_id: null,
  status: 'active', current_period_end: null,
};

const fakeClient = (opts: {
  user: { id: string } | null;
  profile: Profile | null;
  subscription: SubscriptionRow | null;
}): SupabaseClient =>
  ({
    auth: { getUser: async () => ({ data: { user: opts.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: opts.profile }),
          maybeSingle: async () => ({ data: opts.subscription }),
        }),
      }),
    }),
  }) as unknown as SupabaseClient;

beforeEach(() => {
  vi.mocked(redirect).mockClear();
});

describe('getViewer', () => {
  it('aucun utilisateur → null', async () => {
    const v = await getViewer(fakeClient({ user: null, profile: null, subscription: null }));
    expect(v).toBeNull();
  });

  it('utilisateur connecté → user + profil + abonnement', async () => {
    const v = await getViewer(fakeClient({ user: { id: 'u1' }, profile, subscription }));
    expect(v).toEqual({ user: { id: 'u1' }, profile, subscription });
  });

  it('utilisateur sans abonnement → subscription null', async () => {
    const v = await getViewer(fakeClient({ user: { id: 'u1' }, profile, subscription: null }));
    expect(v?.subscription).toBeNull();
    expect(v?.profile).toEqual(profile);
  });
});

describe('requireViewer', () => {
  it('utilisateur connecté → renvoie le viewer, pas de redirect', async () => {
    const v = await requireViewer(fakeClient({ user: { id: 'u1' }, profile, subscription }));
    expect(v.profile).toEqual(profile);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('anonyme → redirect /login', async () => {
    await expect(
      requireViewer(fakeClient({ user: null, profile: null, subscription: null })),
    ).rejects.toThrow('REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
