alter table public.bookings
  add column if not exists guest_payment_status jsonb,
  add column if not exists invited_guests jsonb,
  add column if not exists split_booking boolean default false,
  add column if not exists organizer_name text,
  add column if not exists minimum_guest_threshold bigint,
  add column if not exists payment_deadline text;

notify pgrst, 'reload schema';
