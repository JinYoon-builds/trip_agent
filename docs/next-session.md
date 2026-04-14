# Next Session Handoff

## Current State

- The survey submit flow now prefers server save via Supabase and falls back to local storage only if the server path is unavailable.
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

## Important Runtime Notes

- Local secrets are in `.env.local` and are intentionally not committed.
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
- `POST /api/paypal/capture-order`
  - captures an approved PayPal order and updates the submission to `paid`
- Completion page UI
  - shows travel summary
  - shows a simple `$150 USD` PayPal block
  - renders only the PayPal wallet button

## What To Test First Tomorrow

1. Buy and connect a sending domain first.
2. Recommended cheap candidate seen in Vercel search: `tripagent.company`.
3. After purchase, connect it to the production project on Vercel.
4. In Resend, verify a sending subdomain such as `send.tripagent.company`.
5. Set:
   - `RESEND_API_KEY`
   - `EMAIL_FROM=TripAgent <alerts@send.tripagent.company>`
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

## Useful Files

- `app/survey/survey-client.js`
- `app/survey/complete/survey-complete-client.js`
- `app/api/submissions/route.js`
- `app/api/submissions/[id]/route.js`
- `app/api/paypal/create-order/route.js`
- `app/api/paypal/capture-order/route.js`
- `lib/submission-client.js`
- `lib/supabase-admin.js`
- `lib/paypal.js`
- `supabase/schema.sql`
- `docs/payments-mvp.md`

## Test URLs

- Survey: `http://localhost:3000/survey?lang=ko`
- Completion example: `http://localhost:3000/survey/complete?id=d3ba3511-e0f4-4aa3-ade4-4886310ab58d&lang=ko`
