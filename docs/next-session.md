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
  - PayPal payment section after the summary
  - no internal metadata like submission id, timestamps, or storage status
- PayPal checkout is wired for sandbox and restricted to the PayPal wallet button only.
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

## Latest Decision

- On April 14, 2026, the team decided to pause domain work until the meeting confirms the final domain name.
- On April 15, 2026, the domain decision was finalized as `liu-unnie.com`.
- The product-facing brand name is now `lie-unnie`.
- Resume order after the brand/domain update:
  - reflect `lie-unnie` across the product UI and integration copy
  - purchase or connect `liu-unnie.com` on Vercel
  - register and verify the sending subdomain in Resend
  - set email env vars
  - run the payment flow again and confirm the operator notification email arrives

## Important Runtime Notes

- Local secrets are in `.env.local` and are intentionally not committed.
- There are still 2 local screenshot files in the repo root that were not committed:
  - `paid-state-mobile.png`
  - `paid-state-mobile-final.png`
- The following sensitive keys were pasted into chat during setup and should be rotated after this MVP round:
  - Supabase `service_role`
  - PayPal `client secret`
- Resend notification wiring exists in code, but real email sending is still blocked until a sending domain is set up.
- `NOTIFICATION_EMAIL` is only a temporary local testing target. Final team lead recipient should be set after the domain/email setup is decided.

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
- Completion page UI
  - shows travel summary
  - shows guide-day-based PayPal pricing
  - renders only the PayPal wallet button
- Language switching
  - landing, survey, and completion pages all respond to `?lang=ko|zh|en`
- Date input UX
  - survey uses native date pickers for trip dates instead of free-text travel-date input
- Guide date UX
  - survey converts the selected trip range into tappable date chips for guide-day selection

## What To Test First Tomorrow

1. Buy and connect a sending domain first.
2. Use the finalized domain: `liu-unnie.com`.
3. After purchase or transfer, connect it to the production project on Vercel.
4. In Resend, verify a sending subdomain such as `send.liu-unnie.com`.
5. Set:
   - `RESEND_API_KEY`
   - `EMAIL_FROM=lie-unnie <alerts@send.liu-unnie.com>`
   - `NOTIFICATION_EMAIL=<team lead email>`
6. Re-run the PayPal sandbox payment flow and confirm the operator notification email arrives.

## Next Work

1. Buy the domain and finish Resend sender setup.
2. Test operator notification email delivery after payment.
3. Decide the manual operations flow after payment:
   - where to check newly paid submissions
   - how to send the follow-up guide email manually
4. Add a minimal operator-facing reference:
   - either Supabase table filter instructions
   - or a tiny admin page listing paid submissions
5. After the MVP is stable, add webhook reconciliation and optional Resend automation.
6. Review the English copy quality once the core operator flow is settled.

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
