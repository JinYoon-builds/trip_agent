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
  language text not null default 'zh',
  contact_email text not null,
  applicant_name text,
  answers jsonb not null,
  summary jsonb not null default '[]'::jsonb,
  submission_status text not null default 'awaiting_transfer',
  payment_method text not null default 'manual_qr',
  payment_provider_order_id text,
  payment_provider_capture_id text,
  guide_day_count integer not null default 1,
  quoted_amount numeric(10,2) not null default 0,
  quoted_currency text not null default 'CNY',
  quoted_display_label text not null default 'CNY 0',
  paid_at timestamptz,
  email_sent_at timestamptz,
  email_send_error text,
  payment_completed_email_lock_at timestamptz,
  payment_completed_email_sent_at timestamptz,
  payment_completed_email_error text
);

alter table public.survey_submissions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists applicant_name text,
  add column if not exists submission_status text,
  add column if not exists payment_method text,
  add column if not exists payment_provider_order_id text,
  add column if not exists payment_provider_capture_id text,
  add column if not exists guide_day_count integer,
  add column if not exists quoted_amount numeric(10,2),
  add column if not exists quoted_currency text,
  add column if not exists quoted_display_label text,
  add column if not exists paid_at timestamptz,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_send_error text,
  add column if not exists payment_completed_email_lock_at timestamptz,
  add column if not exists payment_completed_email_sent_at timestamptz,
  add column if not exists payment_completed_email_error text;

update public.survey_submissions
set language = 'en'
where language = 'en';

alter table public.survey_submissions
  drop constraint if exists survey_submissions_language_check;

alter table public.survey_submissions
  add constraint survey_submissions_language_check
  check (language in ('ko', 'zh', 'en'));

update public.survey_submissions
set applicant_name = nullif(trim(coalesce(answers ->> 'fullName', '')), '')
where applicant_name is null;

update public.survey_submissions
set guide_day_count = greatest(
  1,
  case
    when jsonb_typeof(answers -> 'guideDates') = 'array'
      then jsonb_array_length(answers -> 'guideDates')
    else 1
  end
)
where guide_day_count is null;

update public.survey_submissions
set payment_method = case
  when language in ('ko', 'en') then 'paypal'
  else 'manual_qr'
end
where payment_method is null or payment_method = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'survey_submissions'
      and column_name = 'payment_amount'
  ) then
    execute $sql$
      update public.survey_submissions
      set quoted_amount = coalesce(payment_amount, quoted_amount, 0)
      where quoted_amount is null
    $sql$;
  else
    update public.survey_submissions
    set quoted_amount = coalesce(quoted_amount, 0)
    where quoted_amount is null;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'survey_submissions'
      and column_name = 'payment_currency'
  ) then
    execute $sql$
      update public.survey_submissions
      set quoted_currency = coalesce(nullif(payment_currency, ''), quoted_currency, 'CNY')
      where quoted_currency is null or quoted_currency = ''
    $sql$;
  else
    update public.survey_submissions
    set quoted_currency = coalesce(nullif(quoted_currency, ''), 'CNY')
    where quoted_currency is null or quoted_currency = '';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'survey_submissions'
      and column_name = 'payment_display_label'
  ) then
    execute $sql$
      update public.survey_submissions
      set quoted_display_label = coalesce(
        nullif(payment_display_label, ''),
        quoted_display_label,
        concat(quoted_currency, ' ', quoted_amount::text)
      )
      where quoted_display_label is null or quoted_display_label = ''
    $sql$;
  else
    update public.survey_submissions
    set quoted_display_label = coalesce(
      nullif(quoted_display_label, ''),
      concat(quoted_currency, ' ', quoted_amount::text)
    )
    where quoted_display_label is null or quoted_display_label = '';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'survey_submissions'
      and column_name = 'payment_status'
  ) then
    execute $sql$
      update public.survey_submissions
      set submission_status = case
        when payment_status in ('paid') then 'paid'
        when payment_status in ('payment_pending', 'payment_created') then 'payment_review'
        else 'awaiting_transfer'
      end
      where submission_status is null or submission_status = ''
    $sql$;
  else
    update public.survey_submissions
    set submission_status = coalesce(nullif(submission_status, ''), 'awaiting_transfer')
    where submission_status is null or submission_status = '';
  end if;
end
$$;

alter table public.survey_submissions
  alter column payment_method set default 'manual_qr',
  alter column payment_method set not null,
  alter column submission_status set default 'awaiting_transfer',
  alter column submission_status set not null,
  alter column guide_day_count set default 1,
  alter column guide_day_count set not null,
  alter column quoted_amount set default 0,
  alter column quoted_amount set not null,
  alter column quoted_currency set default 'CNY',
  alter column quoted_currency set not null,
  alter column quoted_display_label set default 'CNY 0',
  alter column quoted_display_label set not null;

alter table public.survey_submissions
  drop constraint if exists survey_submissions_payment_method_check;

alter table public.survey_submissions
  add constraint survey_submissions_payment_method_check
  check (payment_method in ('manual_qr', 'paypal'));

alter table public.survey_submissions
  drop constraint if exists survey_submissions_submission_status_check;

alter table public.survey_submissions
  add constraint survey_submissions_submission_status_check
  check (submission_status in ('awaiting_transfer', 'payment_review', 'paid', 'matched', 'cancelled'));

alter table public.survey_submissions
  drop constraint if exists survey_submissions_guide_day_count_check;

alter table public.survey_submissions
  add constraint survey_submissions_guide_day_count_check
  check (guide_day_count > 0);

alter table public.survey_submissions
  drop column if exists payment_status,
  drop column if exists payment_amount,
  drop column if exists payment_currency,
  drop column if exists payment_display_label,
  drop column if exists paypal_order_id,
  drop column if exists paypal_capture_id;

drop index if exists public.survey_submissions_paypal_order_id_key;
drop index if exists public.survey_submissions_paypal_capture_id_key;

create index if not exists survey_submissions_contact_email_idx
  on public.survey_submissions (contact_email);

create index if not exists survey_submissions_user_id_idx
  on public.survey_submissions (user_id);

create index if not exists survey_submissions_submission_status_idx
  on public.survey_submissions (submission_status);

create unique index if not exists survey_submissions_payment_provider_order_id_key
  on public.survey_submissions (payment_provider_order_id)
  where payment_provider_order_id is not null;

create unique index if not exists survey_submissions_payment_provider_capture_id_key
  on public.survey_submissions (payment_provider_capture_id)
  where payment_provider_capture_id is not null;

create index if not exists survey_submissions_created_at_idx
  on public.survey_submissions (created_at desc);

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
  set email = excluded.email,
      updated_at = now();

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
