# Next Session Handoff

> Historical handoff note only. This file is not the canonical source for the current product state. Use [`README.md`](/Users/apple/Documents/100%20Project/trip_agent/README.md) first.

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
  - the quoted amount is recalculated on the server from `answers.guideDates`
- The completion page is simplified for users:
  - travel summary first
  - manual payment section after the summary
  - server submissions now show a full WeChat Pay QR card, sender-name guidance, and next-step guidance
- PayPal checkout routes still exist in the repo, but the live completion page is now centered on the WeChat Pay manual-payment flow.
- Supabase insert was verified against the `survey_submissions` table.
- After the survey/date input update, a fresh local test submission was also created successfully and the completion page opened correctly.
- On April 15, 2026, the production environment was updated end-to-end:
  - `liu-unnie.com` is connected to Vercel
  - the Resend sending domain is verified on `liu-unnie.com`
  - Vercel production env vars for Supabase and Resend are set for the current manual-payment flow
  - a production survey submission email was sent successfully on submit
  - the operator notification subject now includes the quoted amount and sender name
  - the production completion page now renders the WeChat Pay manual-payment version

## Latest Decision

- On April 15, 2026, the domain decision was finalized as `liu-unnie.com`.
- The product-facing brand name is now `刘Unnie`.
- The production MVP stack is now connected:
  - Vercel domain: `liu-unnie.com`
  - payment collection UI: `WeChat Pay` manual QR flow
  - Resend sender: `刘Unnie <alerts@liu-unnie.com>`
  - operator notification target: `jin.yoon.builds@gmail.com`
  - old production main state is preserved on remote branch `legacy-main`

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
- There are several untracked local verification images and notes in the repo root; they were intentionally not committed.

## What Works Today

- `POST /api/submissions`
  - saves survey data to Supabase
  - sends an operator email on survey submission when Resend is configured
  - operator email subject format: `설문 완료 / 결제금액 / 입금자명`
- `GET /api/submissions/[id]`
  - fetches saved submission data
- Resend operator email delivery
  - production submit notification email was verified successfully
- Completion page UI
  - shows travel summary
  - shows guide-day-based pricing
  - renders the manual payment QR card and sender-name guidance for server submissions
  - uses the real WeChat Pay QR asset without image cropping
- Language switching
  - landing, survey, and completion pages all respond to `?lang=ko|zh|en`
- Date input UX
  - survey uses native date pickers for trip dates instead of free-text travel-date input
- Guide date UX
  - survey converts the selected trip range into tappable date chips for guide-day selection
- Production domain and integrations
  - `liu-unnie.com` resolves to the Vercel production project
  - production env vars are set for Supabase and Resend
  - a production survey submission and operator email flow has already been verified once

## What To Test First Tomorrow

1. Re-run one more production survey submission to confirm repeatability.
2. Check `survey_submissions` for the latest rows:
   - `payment_status = awaiting_manual_payment`
   - `payment_amount` / `payment_display_label` match the selected guide dates
3. Confirm Resend delivery logs for the latest production submit email.
4. Decide whether `alerts@liu-unnie.com` should remain the sender or move to a dedicated support/ops sender.

## Next Work

1. Build a minimal operator admin page for manual payment checking.
   - list recent submissions
   - show sender name, quoted amount, contact email, submitted time, and payment status
   - make it easy to filter `awaiting_manual_payment`
2. Define the manual post-payment workflow.
   - how ops marks a submission as payment-confirmed
   - how the matched guide follow-up is tracked
3. Rotate sensitive keys that were exposed during MVP setup.
4. Remove or archive the unused PayPal checkout path if the manual-payment direction is now final.
5. Review the English copy quality once the core operator flow is settled.

## Useful Files

- `app/home-client.js`
- `app/page.js`
- `app/survey/survey-client.js`
- `app/survey/complete/survey-complete-client.js`
- `app/api/submissions/route.js`
- `app/api/submissions/[id]/route.js`
- `lib/submission-client.js`
- `lib/language.js`
- `lib/manual-payment.js`
- `lib/resend.js`
- `lib/supabase-admin.js`
- `supabase/schema.sql`
- `docs/payments-mvp.md`

## Test URLs

- Landing: `http://localhost:3000/?lang=ko`
- Survey: `http://localhost:3000/survey?lang=ko`
- Completion example: `https://liu-unnie.com/survey/complete?id=653381b1-0e16-4736-a6bf-9d9bfd8ab180&lang=ko`
