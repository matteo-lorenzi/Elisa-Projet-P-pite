-- Deux buckets privés : on sert tout via URL signée côté serveur
insert into storage.buckets (id, name, public)
values ('documents-free', 'documents-free', false),
       ('documents-premium', 'documents-premium', false)
on conflict (id) do nothing;

-- Seul l'admin peut uploader/supprimer des objets dans ces buckets.
-- La LECTURE des objets passe par des URLs signées générées côté serveur
-- (service role), donc aucune policy de select public n'est nécessaire.
create policy "storage_admin_write_free" on storage.objects
  for all
  using (bucket_id = 'documents-free' and public.is_admin())
  with check (bucket_id = 'documents-free' and public.is_admin());

create policy "storage_admin_write_premium" on storage.objects
  for all
  using (bucket_id = 'documents-premium' and public.is_admin())
  with check (bucket_id = 'documents-premium' and public.is_admin());
