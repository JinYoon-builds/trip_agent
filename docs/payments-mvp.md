# Payments MVP Setup

This repo is prepared for a `Supabase + PayPal + Resend` flow, while the current survey UI still saves locally.

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
- `PAYPAL_ORDER_AMOUNT`
- `PAYPAL_ORDER_CURRENCY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL`

## Pricing note

The landing page can display `₩200,000`, but PayPal still needs a real settlement amount and currency.

- `PAYMENT_DISPLAY_LABEL=₩200,000`
- `PAYPAL_ORDER_AMOUNT` and `PAYPAL_ORDER_CURRENCY` should be the actual merchant charge amount

If buyers pay in a different currency, PayPal handles the conversion on their side depending on PayPal settings and buyer preferences.

## Supabase

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

## Next step to wire the UI

1. Replace the local-only submit call in `app/survey/survey-client.js` with `POST /api/submissions`.
2. Fetch the saved submission on `/survey/complete`.
3. Add the PayPal JS SDK on the completion page using `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
4. Call `create-order` and `capture-order` from the completion page.
5. Add a webhook route later as a backstop for payment reconciliation.
