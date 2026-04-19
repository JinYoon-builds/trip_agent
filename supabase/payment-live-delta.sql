begin;

alter table public.survey_submissions
  add column if not exists payment_method text,
  add column if not exists payment_provider_order_id text,
  add column if not exists payment_provider_capture_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_completed_email_lock_at timestamptz,
  add column if not exists payment_completed_email_sent_at timestamptz,
  add column if not exists payment_completed_email_error text;

update public.survey_submissions
set payment_method = case
  when language in ('ko', 'en') then 'paypal'
  else 'manual_qr'
end
where payment_method is null or payment_method = '';

alter table public.survey_submissions
  alter column payment_method set default 'manual_qr',
  alter column payment_method set not null;

alter table public.survey_submissions
  drop constraint if exists survey_submissions_payment_method_check;

alter table public.survey_submissions
  add constraint survey_submissions_payment_method_check
  check (payment_method in ('manual_qr', 'paypal'));

create unique index if not exists survey_submissions_payment_provider_order_id_key
  on public.survey_submissions (payment_provider_order_id)
  where payment_provider_order_id is not null;

create unique index if not exists survey_submissions_payment_provider_capture_id_key
  on public.survey_submissions (payment_provider_capture_id)
  where payment_provider_capture_id is not null;

commit;
