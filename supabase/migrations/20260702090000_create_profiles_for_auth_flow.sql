create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  firebase_uid text,
  phone_number text,
  full_name text,
  city text,
  budget text,
  celebration_goal text,
  date_time_preference text,
  guest_count text,
  occasion_type text,
  preferred_vibe text,
  referral_code text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists firebase_uid text,
  add column if not exists phone_number text,
  add column if not exists full_name text,
  add column if not exists city text,
  add column if not exists budget text,
  add column if not exists celebration_goal text,
  add column if not exists date_time_preference text,
  add column if not exists guest_count text,
  add column if not exists occasion_type text,
  add column if not exists preferred_vibe text,
  add column if not exists referral_code text,
  add column if not exists last_login timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_auth_user_id_key
  on public.profiles(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists profiles_firebase_uid_key
  on public.profiles(firebase_uid)
  where firebase_uid is not null;

create unique index if not exists profiles_phone_number_key
  on public.profiles(phone_number)
  where phone_number is not null;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

notify pgrst, 'reload schema';
