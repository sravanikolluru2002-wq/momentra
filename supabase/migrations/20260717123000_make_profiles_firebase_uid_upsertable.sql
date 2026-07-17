drop index if exists public.profiles_firebase_uid_key;

create unique index if not exists profiles_firebase_uid_key
  on public.profiles(firebase_uid);

notify pgrst, 'reload schema';
