create extension if not exists pgcrypto;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null,
  appointment_time timestamptz not null,
  confirmation_status text not null default 'pending'
    check (confirmation_status in ('pending', 'sent', 'simulated', 'failed', 'skipped')),
  confirmation_sent_at timestamptz,
  confirmation_payload jsonb,
  confirmation_error text,
  reminder_status text not null default 'pending'
    check (reminder_status in ('pending', 'sent', 'simulated', 'failed', 'skipped')),
  reminder_sent_at timestamptz,
  reminder_payload jsonb,
  reminder_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_created_at_idx
  on public.appointments (created_at desc);

create index if not exists appointments_reminder_due_idx
  on public.appointments (appointment_time, reminder_status);

alter table public.appointments enable row level security;

drop policy if exists "Allow public read for dashboard" on public.appointments;
create policy "Allow public read for dashboard"
  on public.appointments
  for select
  using (true);

-- Inserts and updates are performed only by the server-side service role key.
