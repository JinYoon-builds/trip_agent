# Liu-Unnie / 刘Unnie

Liu-Unnie is a multilingual private local-guide matching MVP for travelers visiting Korea.  
The public-facing brand is locale-aware:

- `en`, `ko`: **Liu-Unnie**
- `zh`: **刘Unnie**

The product currently supports authenticated survey submission, language-specific guide pricing, locale-specific payment flows, admin review, email notifications, and GA4 funnel analytics.

## Live URLs

- Production: <https://liu-unnie.com>
- English survey: <https://liu-unnie.com/survey?lang=en>
- Korean survey: <https://liu-unnie.com/survey?lang=ko>
- Chinese survey: <https://liu-unnie.com/survey?lang=zh>
- Admin: <https://liu-unnie.com/admin>

## Product Flow

1. A user opens the site in English by default, or switches to `ko` / `zh`.
2. The user fills out a 2-step travel survey.
3. Before final submission, the user must log in and complete email verification.
4. The server saves the submission in Supabase and calculates guide pricing by selected guide days and language.
5. Payment flow is selected by language:
   - `zh`: WeChat Pay QR / manual review flow.
   - `ko`, `en`: PayPal checkout with USD pricing.
6. When PayPal capture succeeds, the submission is marked `paid` automatically.
7. When a payment is completed, customer and operator completion emails are sent through Resend when configured.
8. Operators can review submissions and update workflow status in the admin console.

## Payment and Pricing

### Chinese (`zh`)

- Payment method: WeChat Pay QR manual payment.
- Currency: `CNY`.
- Pricing:
  - 1 day: `CNY 600`
  - 2 days: `CNY 1,080` total (`10%` discount)
  - 3+ days: `CNY 480/day` (`20%` discount)

### English / Korean (`en`, `ko`)

- Payment method: PayPal checkout.
- Currency: `USD`.
- Pricing:
  - 1 day: `USD 50`
  - 2 days: `USD 90` total (`10%` discount)
  - 3+ days: `USD 40/day` (`20%` discount)

## What Works

- English default language when `lang` is omitted.
- `en / ko / zh` language switching.
- Locale-aware visible brand:
  - `Liu-Unnie` for English/Korean.
  - `刘Unnie` for Chinese.
- Supabase Auth login/signup flow.
- Email verification gate before survey submission.
- Shared auth modal across landing, survey, account, and admin pages.
- Supabase-backed survey submission storage.
- Owner-protected submission reads.
- User account page with submission list/status.
- Edit support for unpaid `awaiting_transfer` submissions.
- `customer / admin` role split.
- Admin submission list/detail/status update pages.
- Language-specific guide quote calculation.
- `zh` manual QR payment flow.
- `ko / en` PayPal order/create/capture flow.
- Automatic `paid` transition on successful PayPal capture.
- Payment audit fields in `survey_submissions`.
- Payment-completion notification email path.
- GA4/GTM event tracking for landing, survey, validation, submission, completion, and PayPal funnel events.
- Production deployment on Vercel.

## Stack

- Next.js App Router
- React
- Supabase Auth + Postgres
- PayPal Orders API
- Resend
- GA4 / Google Tag Manager
- Vercel

## Key Documents

- [Setup Guide](./docs/setup.md) — local/prod environment variables and setup checklist.
- [Architecture](./docs/architecture.md) — app layers, auth boundaries, survey/payment/admin flows.
- [API Reference](./docs/api.md) — implemented route contracts and examples.
- [Data Model](./docs/data-model.md) — Supabase tables, status semantics, quote/payment fields.
- [Analytics Tracking Reference](./docs/analytics.md) — GA4/GTM events, parameters, and suggested funnel setup.
- [Next Session Notes](./docs/next-session.md) — historical operating notes and older handoff details.

## Important Files

- App pages: [`app/`](./app)
- Auth UI/provider: [`components/`](./components)
- Domain helpers: [`lib/`](./lib)
- Supabase schema: [`supabase/schema.sql`](./supabase/schema.sql)
- Payment DB delta used for live rollout: [`supabase/payment-live-delta.sql`](./supabase/payment-live-delta.sql)
- Public QR assets: [`public/`](./public)

## Local Development

```bash
npm install
npm run dev
```

Local development requires Supabase config in `.env.local`. See [docs/setup.md](./docs/setup.md).

Minimum local env for auth/submissions:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional local env for payment/email/analytics:

```env
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=

RESEND_API_KEY=
EMAIL_FROM=
NOTIFICATION_EMAIL=

NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Build

```bash
npm run build
```

## Deployment Notes

- Production runs on Vercel.
- Vercel env changes require a redeploy before they affect runtime behavior.
- Supabase schema changes must be applied separately in Supabase SQL Editor.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` must be set and redeployed for direct GA4 tracking.
- PayPal live checkout requires live credentials:
  - `PAYPAL_ENV=live`
  - `PAYPAL_CLIENT_ID=<live client id>`
  - `PAYPAL_CLIENT_SECRET=<live secret>`
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID=<live client id>`

## Operational Follow-ups

Before considering payment/email fully production-verified, run one live end-to-end check:

1. Submit a new `en` or `ko` request.
2. Complete one PayPal live payment.
3. Confirm Supabase fields:
   - `submission_status = paid`
   - `payment_provider_capture_id` is present
   - `paid_at` is present
   - `payment_completed_email_sent_at` is present
   - `payment_completed_email_error` is `null`
4. Confirm customer and operator received the completion emails.
5. Confirm GA4 Realtime shows the relevant `page_view`, survey, and PayPal events.

## Notes

- Chinese payment flow intentionally remains manual QR-based.
- English/Korean payment flow intentionally uses PayPal and USD.
- Admin status transitions are constrained by the current workflow in `lib/submission-utils.js`.
- Existing untracked screenshots in the repository root are visual-reference artifacts, not required runtime assets unless explicitly moved into tracked docs/public paths.
