# Payments MVP Setup

This repo is prepared for a `Supabase + PayPal + Resend` flow.

## What is already scaffolded

- `POST /api/submissions`
  - validate survey payload
  - save a submission row into Supabase
- `GET /api/submissions/:id`
  - fetch a saved submission
- `POST /api/paypal/create-order`
  - create a PayPal order for an existing submission
- `POST /api/paypal/capture-order`
  - capture a PayPal order
  - update payment state in Supabase
  - send an operator notification through Resend

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL` (`comma-separated` if you want multiple recipients)
- `PAYPAL_ORDER_DESCRIPTION` (optional)

## Pricing note

Pricing is now calculated dynamically from the guide dates the traveler selects in the survey.

- 1 guide day: `$89`
- 2 guide days: `10%` discount
- 3 or more guide days: `20%` discount

The survey page can preview the price in frontend JavaScript, but the final PayPal order amount is recalculated on the server from `answers.guideDates` before checkout. Settlement currency remains `USD`.

## Supabase

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

## Next step to wire the UI

1. Keep the guide-day pricing rules in `lib/pricing.js` as the single source of truth.
2. If the pricing policy changes, update both the survey preview and PayPal order creation through that shared helper.
3. Add a webhook route later as a backstop for payment reconciliation.
