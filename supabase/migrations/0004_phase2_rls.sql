-- 0004_phase2_rls.sql — Phase 2 : admin gère les rôles, index webhook Stripe

-- L'admin peut mettre à jour n'importe quel profil (changement de rôle manuel).
-- (La policy 0002 profiles_update_own ne couvre que sa propre ligne.)
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Le webhook retrouve la ligne d'abonnement via le customer Stripe.
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);
