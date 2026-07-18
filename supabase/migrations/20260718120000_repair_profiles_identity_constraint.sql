-- Firebase users are identified by firebase_uid. The profile row's generated
-- id must not be tied to a separate public.users table.
create extension if not exists pgcrypto;

alter table public.profiles
  drop constraint if exists profiles_id_fkey,
  drop constraint if exists profiles_user_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

-- Keep the conflict target used by the web client valid for Firebase users.
drop index if exists public.profiles_firebase_uid_key;

create unique index if not exists profiles_firebase_uid_key
  on public.profiles(firebase_uid)
  where firebase_uid is not null;

notify pgrst, 'reload schema';
