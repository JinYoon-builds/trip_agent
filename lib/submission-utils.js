import { createHttpError } from "./http-errors";
import { normalizeSiteLanguage } from "./language";
import {
  formatPaymentDisplayLabel,
  getGuideDayCountFromAnswers,
  getGuidePricingQuote,
} from "./pricing";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(value);
}

export function sanitizeSummary(summary) {
  if (!Array.isArray(summary)) {
    return [];
  }

  return summary
    .map((item) => ({
      label: typeof item?.label === "string" ? item.label.trim() : "",
      value: typeof item?.value === "string" ? item.value.trim() : "",
    }))
    .filter((item) => item.label && item.value);
}

export function validateSubmissionPayload(payload) {
  const language = normalizeSiteLanguage(payload?.language);
  const answers =
    payload?.answers && typeof payload.answers === "object" && !Array.isArray(payload.answers)
      ? payload.answers
      : null;
  const summary = sanitizeSummary(payload?.summary);
  const contactEmail =
    typeof payload?.contactEmail === "string"
      ? payload.contactEmail.trim()
      : typeof answers?.contactEmail === "string"
        ? answers.contactEmail.trim()
        : "";

  if (!answers) {
    throw createHttpError(400, "Survey answers payload is invalid.");
  }

  if (!contactEmail || !isValidEmail(contactEmail)) {
    throw createHttpError(400, "A valid contact email is required.");
  }

  if (answers.contactEmailConfirmed !== true) {
    throw createHttpError(
      400,
      "Contact email confirmation is required before submission.",
    );
  }

  if (summary.length === 0) {
    throw createHttpError(400, "Submission summary is missing.");
  }

  const wechatId =
    typeof answers.wechatId === "string" ? answers.wechatId.trim() : "";

  return {
    language,
    answers: {
      ...answers,
      contactEmail,
      contactEmailConfirmed: true,
      wechatId,
    },
    summary,
    contactEmail,
  };
}

export function createSubmissionInsert(payload) {
  const guideDayCount = getGuideDayCountFromAnswers(payload.answers);
  const pricingQuote = getGuidePricingQuote({ guideDayCount });

  return {
    language: payload.language,
    contact_email: payload.contactEmail,
    answers: payload.answers,
    summary: payload.summary,
    payment_status: "pending_payment",
    payment_amount: pricingQuote.totalAmount,
    payment_currency: pricingQuote.currency,
    payment_display_label: formatPaymentDisplayLabel({
      amount: pricingQuote.totalAmount,
      currency: pricingQuote.currency,
      language: payload.language,
    }),
  };
}

export function serializeSubmission(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    language: record.language,
    contactEmail: record.contact_email,
    answers: record.answers,
    summary: sanitizeSummary(record.summary),
    paymentStatus: record.payment_status,
    paymentAmount: record.payment_amount,
    paymentCurrency: record.payment_currency,
    paymentDisplayLabel: record.payment_display_label,
    paypalOrderId: record.paypal_order_id,
    paypalCaptureId: record.paypal_capture_id,
    emailSentAt: record.email_sent_at,
    emailSendError: record.email_send_error,
    submittedAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function formatSummaryAsText(summary) {
  return sanitizeSummary(summary)
    .map((item) => `${item.label}: ${item.value}`)
    .join("\n");
}
