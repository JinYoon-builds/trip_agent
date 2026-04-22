# Analytics Tracking Reference

This document describes the GA4/GTM tracking events currently emitted by the app.

## Setup

The app can send analytics through both:

- Google Tag Manager: `NEXT_PUBLIC_GTM_ID`
- Direct GA4 gtag: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

`NEXT_PUBLIC_GA_MEASUREMENT_ID` should be a GA4 measurement ID such as `G-6SEZ99G75K`.

The app disables GA4's automatic page view and sends controlled `page_view` events from `app/ga4-page-tracker.js` instead.

## Common parameters

Most events include one or more of these fields:

- `language`: normalized site language (`en`, `ko`, `zh`)
- `survey_id`: currently `guide_matching_v1`
- `step_id`: survey step identifier
- `step_number`: 1-based survey step number
- `submission_id`: server submission UUID
- `amount`: quoted/payment amount
- `currency`: quoted/payment currency

## Page view tracking

### `page_view`

Sent on route / query-language changes.

Parameters:

- `page_path`
- `page_title`
- `page_location`
- `language`
- `page_type`

`page_type` values:

| Route | page_type |
| --- | --- |
| `/` | `landing` |
| `/survey` | `survey` |
| `/survey/complete` | `survey_complete` |
| Anything else | `other` |

## Landing page events

### `landing_cta_click`

Sent when the primary landing CTA is clicked.

Parameters:

- `component`: currently `hero_primary`
- `language`

### `language_switch`

Sent when the user changes language on the landing page.

Parameters:

- `component`: `landing`
- `from_language`
- `to_language`

## Authentication events

### `auth_modal_open`

Sent when the shared login/signup modal opens.

Parameters:

- `auth_mode`: e.g. `signIn`, `signUp`
- `auth_reason`: e.g. `general`, `survey-submit`, `admin`

## Survey progression events

### `survey_step_view`

Sent when a survey step is viewed.

Parameters:

- `survey_id`
- `language`
- `step_id`
- `step_number`
- `visible_field_count`
- `answered_field_count`

### `survey_field_interaction`

Sent when a user interacts with a survey field.

Parameters:

- `survey_id`
- `language`
- `step_id`
- `step_number`
- `field_id`
- `field_kind`
- `interaction_type`
- `input_target`
- `selection_count`
- `is_complete`

### `survey_validation_error`

Sent when survey validation blocks submission or step progress.

Parameters:

- `survey_id`
- `language`
- `step_id`
- `step_number`
- `field_id`
- `validation_reason`

Known `validation_reason` values:

- `required_missing`
- `invalid_email`
- `email_unconfirmed`

### `survey_abandon`

Sent when a user starts the survey but leaves before submission.

Parameters:

- `survey_id`
- `language`
- `step_id`
- `step_number`
- `answered_field_count`
- `total_field_count`
- `visible_field_count`
- `last_field_id`
- `last_field_kind`
- `transport_type`

Known `transport_type` values:

- `beacon`
- `navigation`

## Survey submission events

### `survey_submit_attempt`

Sent when the user attempts to submit the survey.

Parameters:

- `survey_id`
- `language`
- `step_id`
- `step_number`
- `answered_field_count`
- `total_field_count`

### `survey_submit_success`

Sent when survey submission succeeds.

Parameters:

- `survey_id`
- `language`
- `storage_mode`: `server` or `local`
- `answered_field_count`
- `total_field_count`
- `guide_day_count`
- `discount_percent`
- `amount`
- `currency`

### `survey_submit_error`

Sent when survey submission fails.

Parameters:

- `survey_id`
- `language`
- `step_id`
- `step_number`

## Completion page events

### `survey_complete_view`

Sent when the completion page is viewed after loading a submission/local fallback.

Parameters:

- `language`
- `storage_mode`
- `submission_status`
- `guide_day_count`
- `amount`
- `currency`

## PayPal checkout events

### `paypal_create_order_attempt`

Sent when PayPal order creation starts.

Parameters:

- `language`
- `submission_id`

### `paypal_create_order_success`

Sent when PayPal order creation succeeds.

Parameters:

- `language`
- `submission_id`
- `order_id`

### `paypal_create_order_error`

Sent when PayPal order creation fails.

Parameters:

- `language`
- `submission_id`
- `error_message`

### `paypal_capture_attempt`

Sent when PayPal capture starts after approval.

Parameters:

- `language`
- `submission_id`
- `order_id`

### `paypal_capture_success`

Sent when PayPal capture succeeds and the client receives the paid submission response.

Parameters:

- `language`
- `submission_id`
- `capture_id`

### `paypal_capture_error`

Sent when PayPal capture fails.

Parameters:

- `language`
- `submission_id`
- `order_id`
- `error_message`

## Recommended GA4 funnel views

Suggested funnel steps:

1. `page_view` where `page_type = landing`
2. `landing_cta_click`
3. `survey_step_view` where `step_number = 1`
4. `survey_step_view` where `step_number = 2`
5. `survey_submit_attempt`
6. `survey_submit_success`
7. `survey_complete_view`
8. `paypal_create_order_success`
9. `paypal_capture_success`

Useful breakdown dimensions:

- `language`
- `currency`
- `guide_day_count`
- `discount_percent`
- `storage_mode`
- `submission_status`
