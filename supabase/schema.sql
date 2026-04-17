create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  language text not null check (language in ('ko', 'zh')),
  contact_email text not null,
  answers jsonb not null,
  summary jsonb not null default '[]'::jsonb,
  payment_status text not null default 'awaiting_manual_payment',
  payment_amount numeric(10,2),
  payment_currency text,
  payment_display_label text not null default '₩200,000',
  paypal_order_id text,
  paypal_capture_id text,
  email_sent_at timestamptz,
  email_send_error text
);

create unique index if not exists survey_submissions_paypal_order_id_key
  on public.survey_submissions (paypal_order_id)
  where paypal_order_id is not null;

create unique index if not exists survey_submissions_paypal_capture_id_key
  on public.survey_submissions (paypal_capture_id)
  where paypal_capture_id is not null;

create index if not exists survey_submissions_contact_email_idx
  on public.survey_submissions (contact_email);

create index if not exists survey_submissions_user_id_idx
  on public.survey_submissions (user_id);

create index if not exists survey_submissions_payment_status_idx
  on public.survey_submissions (payment_status);

create index if not exists profiles_role_idx
  on public.profiles (role);

create or replace function public.set_survey_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

insert into public.profiles (id, email, role)
select users.id, users.email, 'customer'
from auth.users as users
on conflict (id) do update
  set email = excluded.email;

drop trigger if exists survey_submissions_set_updated_at on public.survey_submissions;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

create trigger survey_submissions_set_updated_at
before update on public.survey_submissions
for each row
execute function public.set_survey_submissions_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_profile();

create trigger on_auth_user_updated
after update of email on auth.users
for each row
execute function public.handle_auth_user_profile();

alter table public.survey_submissions enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "customers can insert own submissions" on public.survey_submissions;
drop policy if exists "customers can read own submissions" on public.survey_submissions;
drop policy if exists "users can read own profile" on public.profiles;

create policy "customers can insert own submissions"
on public.survey_submissions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "customers can read own submissions"
on public.survey_submissions
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
