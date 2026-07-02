alter table public.bookings
  add column if not exists paid_guest_count bigint default 0;

notify pgrst, 'reload schema';
