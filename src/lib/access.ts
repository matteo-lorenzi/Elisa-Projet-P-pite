import type { Profile, SubscriptionRow, DocumentRow } from './supabase/types';

export function hasPremiumAccess(
  profile: Profile,
  subscription: SubscriptionRow | null,
): boolean {
  if (profile.role === 'admin') return true;
  return subscription?.status === 'active';
}

export function canViewDocumentFile(
  profile: Profile,
  subscription: SubscriptionRow | null,
  doc: DocumentRow,
): boolean {
  if (!doc.is_premium) return true;
  return hasPremiumAccess(profile, subscription);
}
