-- Helper : l'utilisateur courant est-il admin ?
create function public.is_admin()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.documents enable row level security;
alter table public.newsletter_editions enable row level security;

-- profiles : chacun lit/écrit sa ligne ; admin lit tout
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'free' or public.is_admin());

-- subscriptions : chacun lit sa ligne ; admin lit tout
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- documents : tout utilisateur authentifié lit les METADONNEES ;
-- seul l'admin insère/modifie/supprime
create policy "documents_select_all_auth" on public.documents
  for select using (auth.role() = 'authenticated');
create policy "documents_admin_write" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

-- newsletter_editions : admin uniquement (Phase 3)
create policy "newsletter_admin_all" on public.newsletter_editions
  for all using (public.is_admin()) with check (public.is_admin());
