# Next Session Handoff

## Current State

- The landing page, survey page, and completion page now support 3 separate language versions:
  - Korean
  - Chinese
  - English
- The language switch is now consistent across the user flow:
  - `한국어`
  - `中文`
  - `English`
- Language handling is normalized through `lib/language.js` so page routing, submission payloads, and PayPal locale use the same `ko/zh/en` rules.
- The survey submit flow now prefers server save via Supabase and falls back to local storage only if the server path is unavailable.
- The survey has been simplified to a 2-step structure.
- Travel dates are no longer free-text:
  - single-city MVP assumption
  - start date and end date now use native HTML `date` inputs for lower mobile input error rate
- The survey now asks for an approximate daily budget using a slider UI:
  - page 3 travel-type questions were removed
  - budget is now part of page 2 travel details
  - budget unit is `CNY`
  - keyboard input is avoided for budget selection
- The survey now asks which exact travel dates need a guide:
  - users select guide-needed dates from the trip date range
  - only selected guide dates are billable
  - survey sidebar shows a live frontend price preview
- Guide pricing is now dynamic instead of fixed:
  - 1 day = `$89`
  - 2 days = `10%` discount
  - 3+ days = `20%` discount
  - PayPal order amount is recalculated on the server from `answers.guideDates`
- The completion page is simplified for users:
  - travel summary first
  - manual payment section after the summary
  - server submissions now show a WeChat Pay QR card, sender-name guidance, and next-step guidance
- PayPal checkout routes still exist for the old sandbox flow, but the completion page is now pivoting away from the PayPal button UI.
- A successful `create-order` call was verified against the sandbox PayPal app.
- Supabase insert was verified against the `survey_submissions` table.
- The paid-state UX on the completion page is now implemented:
  - green success check block
  - paid-specific hero copy
  - no PayPal button after payment is completed
- A full sandbox buyer flow was verified in the browser:
  - submission moved to `payment_status = paid`
  - completion page rendered the new paid-state UX correctly on mobile
- After the survey/date input update, a fresh local test submission was also created successfully and the completion page opened correctly.
- On April 15, 2026, the production environment was completed end-to-end:
  - `liu-unnie.com` is connected to Vercel
  - the Resend sending domain is verified on `liu-unnie.com`
  - Vercel production env vars for Supabase, PayPal, and Resend are now set
  - a production sandbox payment was completed successfully
  - the operator notification email arrived successfully
  - the production submission row updated to `payment_status = paid`

## Latest Decision

- On April 15, 2026, the domain decision was finalized as `liu-unnie.com`.
- The product-facing brand name is now `liu-unnie`.
- The production MVP stack is now connected:
  - Vercel domain: `liu-unnie.com`
  - PayPal environment: `sandbox`
  - Resend sender: `liu-unnie <alerts@liu-unnie.com>`
  - operator notification target: `jin.yoon.builds@gmail.com`

## Important Runtime Notes

- Local secrets are in `.env.local` and are intentionally not committed.
- Manual payment UI now reads these public env vars when present:
  - `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`
- There are still 2 local screenshot files in the repo root that were not committed:
  - `paid-state-mobile.png`
  - `paid-state-mobile-final.png`
- The following sensitive keys were pasted into chat during setup and should be rotated after this MVP round:
  - Supabase `service_role`
  - PayPal `client secret`
- `NOTIFICATION_EMAIL` can now accept multiple recipients as a comma-separated list. Replace the current testing target with the final operator inbox list before live launch.
- `PAYPAL_ENV` is still `sandbox`. Switch both client and server PayPal credentials together when moving to live.

## What Works Today

- `POST /api/submissions`
  - saves survey data to Supabase
- `GET /api/submissions/[id]`
  - fetches saved submission data
- `POST /api/paypal/create-order`
  - creates a sandbox PayPal order for a saved submission
  - recomputes amount from selected guide dates
- `POST /api/paypal/capture-order`
  - captures an approved PayPal order and updates the submission to `paid`
- Resend operator email delivery
  - sends a paid notification email successfully from production
- Completion page UI
  - shows travel summary
  - shows guide-day-based pricing
  - renders the manual payment QR card and sender-name guidance for server submissions
- Language switching
  - landing, survey, and completion pages all respond to `?lang=ko|zh|en`
- Date input UX
  - survey uses native date pickers for trip dates instead of free-text travel-date input
- Guide date UX
  - survey converts the selected trip range into tappable date chips for guide-day selection
- Production domain and integrations
  - `liu-unnie.com` resolves to the Vercel production project
  - production env vars are set for Supabase, PayPal sandbox, and Resend
  - a production sandbox payment and email flow has already been verified once

## What To Test First Tomorrow

1. Re-run one more production sandbox payment to confirm repeatability.
2. Check `survey_submissions` for the latest rows:
   - `payment_status = paid`
   - PayPal order and capture IDs present
3. Confirm Resend delivery logs for the latest production payment.
4. Decide whether `alerts@liu-unnie.com` should remain the sender or move to a dedicated support/ops sender.

## Next Work

1. Decide the manual operations flow after payment:
   - where to check newly paid submissions
   - how to send the follow-up guide email manually
2. Add a minimal operator-facing workflow note:
   - either Supabase table filter instructions
   - or a tiny admin page listing paid submissions
3. Rotate sensitive keys that were exposed during MVP setup.
4. After the MVP is stable, add webhook reconciliation and optional Resend automation.
5. Review the English copy quality once the core operator flow is settled.

## Useful Files

- `app/home-client.js`
- `app/page.js`
- `app/survey/survey-client.js`
- `app/survey/complete/survey-complete-client.js`
- `app/api/submissions/route.js`
- `app/api/submissions/[id]/route.js`
- `app/api/paypal/create-order/route.js`
- `app/api/paypal/capture-order/route.js`
- `lib/submission-client.js`
- `lib/language.js`
- `lib/supabase-admin.js`
- `lib/paypal.js`
- `supabase/schema.sql`
- `docs/payments-mvp.md`

## Test URLs

- Landing: `http://localhost:3000/?lang=ko`
- Survey: `http://localhost:3000/survey?lang=ko`
- Completion example: `http://localhost:3000/survey/complete?id=365dfa59-6008-4e24-82f3-43baaf384e9c&lang=ko`
