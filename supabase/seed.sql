-- Documents de démonstration (les fichiers storage doivent être uploadés à la main
-- via Studio, ou par l'admin via l'UI ; ce seed ne crée que les métadonnées).
insert into public.documents (title, description, author, type, storage_path, is_premium, category, tags)
values
  ('Introduction au bail rural', 'Les bases du bail rural expliquées simplement.',
   'Élisa', 'pdf', 'demo/intro-bail-rural.pdf', false, 'Baux', array['bail','débutant']),
  ('Schéma : cycle du fermage', 'Schéma explicatif du cycle du fermage.',
   'Élisa', 'schema', 'demo/cycle-fermage.png', true, 'Baux', array['fermage','schéma'])
on conflict do nothing;
