create extension if not exists pgcrypto;

create table if not exists public.survey_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  language text not null check (language in ('ko', 'zh')),
  contact_email text not null,
  answers jsonb not null,
  summary jsonb not null default '[]'::jsonb,
  payment_status text not null default 'pending_payment',
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

create index if not exists survey_submissions_payment_status_idx
  on public.survey_submissions (payment_status);

create or replace function public.set_survey_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists survey_submissions_set_updated_at on public.survey_submissions;

create trigger survey_submissions_set_updated_at
before update on public.survey_submissions
for each row
execute function public.set_survey_submissions_updated_at();

alter table public.survey_submissions enable row level security;
