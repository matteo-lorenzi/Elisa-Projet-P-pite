import { describe, it, expect } from 'vitest';
import { hasPremiumAccess, canViewDocumentFile } from './access';
import type { Profile, SubscriptionRow, DocumentRow } from './supabase/types';

const baseProfile = (role: Profile['role']): Profile => ({
  id: 'u1', email: 'a@b.fr', full_name: null, display_name: null,
  role, newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z',
});

const sub = (status: string | null): SubscriptionRow => ({
  user_id: 'u1', stripe_customer_id: null, stripe_subscription_id: null,
  status, current_period_end: null,
});

const doc = (is_premium: boolean): DocumentRow => ({
  id: 'd1', title: 'T', description: null, author: null, type: 'pdf',
  storage_path: 'documents-free/d1.pdf', is_premium, category: null,
  tags: [], created_at: '2026-01-01T00:00:00Z',
});

describe('hasPremiumAccess', () => {
  it('admin a toujours accès premium', () => {
    expect(hasPremiumAccess(baseProfile('admin'), null)).toBe(true);
  });
  it('abonnement actif donne accès premium', () => {
    expect(hasPremiumAccess(baseProfile('free'), sub('active'))).toBe(true);
  });
  it('abonnement past_due ne donne pas accès premium', () => {
    expect(hasPremiumAccess(baseProfile('free'), sub('past_due'))).toBe(false);
  });
  it('aucun abonnement ne donne pas accès premium', () => {
    expect(hasPremiumAccess(baseProfile('free'), null)).toBe(false);
  });
});

describe('hasPremiumAccess — override rôle paid', () => {
  it('rôle paid sans abonnement → accès premium', () => {
    expect(hasPremiumAccess(baseProfile('paid'), null)).toBe(true);
  });
  it('rôle free sans abonnement → pas d’accès', () => {
    expect(hasPremiumAccess(baseProfile('free'), null)).toBe(false);
  });
  it('rôle free + abonnement active → accès', () => {
    expect(hasPremiumAccess(baseProfile('free'), sub('active'))).toBe(true);
  });
});

describe('canViewDocumentFile', () => {
  it('document gratuit visible par un compte free', () => {
    expect(canViewDocumentFile(baseProfile('free'), null, doc(false))).toBe(true);
  });
  it('document premium NON visible par un compte free sans abonnement', () => {
    expect(canViewDocumentFile(baseProfile('free'), null, doc(true))).toBe(false);
  });
  it('document premium visible par un compte free avec abonnement actif', () => {
    expect(canViewDocumentFile(baseProfile('free'), sub('active'), doc(true))).toBe(true);
  });
  it('document premium visible par un admin', () => {
    expect(canViewDocumentFile(baseProfile('admin'), null, doc(true))).toBe(true);
  });
});
