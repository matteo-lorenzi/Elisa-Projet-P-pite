-- Enums
create type user_role as enum ('free', 'paid', 'admin');
create type document_type as enum ('pdf', 'schema');

-- Profils (1 ligne par utilisateur auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  display_name text,
  role user_role not null default 'free',
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Abonnements (rempli par Stripe en Phase 2 ; présent pour la dérivation du rôle)
create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz
);

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  author text,
  type document_type not null,
  storage_path text not null,
  is_premium boolean not null default false,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Newsletter (utilisée en Phase 3 ; table créée tôt pour stabilité du schéma)
create table public.newsletter_editions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  sent_at timestamptz
);

-- Crée automatiquement un profil à l'inscription
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
