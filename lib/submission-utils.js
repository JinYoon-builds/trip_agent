import { createHttpError } from "./http-errors";
import { normalizeSiteLanguage } from "./language";
import { getPaymentMethodForLanguage } from "./payment";
import {
  formatPaymentDisplayLabel,
  getGuideDayCountFromAnswers,
  getGuidePricingQuote,
} from "./pricing";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ADMIN_MUTABLE_SUBMISSION_STATUSES = [
  "payment_review",
  "paid",
  "matched",
  "cancelled",
];
const OWNER_EDITABLE_SUBMISSION_STATUSES = ["awaiting_transfer"];
const ADMIN_STATUS_TRANSITIONS = {
  awaiting_transfer: ["payment_review", "paid", "cancelled"],
  payment_review: ["paid", "cancelled"],
  paid: ["matched", "cancelled"],
  matched: [],
  cancelled: [],
};

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
  const applicantName =
    typeof answers.fullName === "string" ? answers.fullName.trim() : "";

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
    applicantName,
  };
}

export function createSubmissionInsert(payload) {
  const guideDayCount = getGuideDayCountFromAnswers(payload.answers);
  const pricingQuote = getGuidePricingQuote({
    guideDayCount,
    language: payload.language,
  });

  return {
    language: payload.language,
    contact_email: payload.contactEmail,
    applicant_name: payload.applicantName || null,
    answers: payload.answers,
    summary: payload.summary,
    submission_status: "awaiting_transfer",
    payment_method: getPaymentMethodForLanguage(payload.language),
    payment_provider_order_id: null,
    payment_provider_capture_id: null,
    paid_at: null,
    payment_completed_email_sent_at: null,
    payment_completed_email_error: null,
    guide_day_count: guideDayCount,
    quoted_amount: pricingQuote.totalAmount,
    quoted_currency: pricingQuote.currency,
    quoted_display_label: formatPaymentDisplayLabel({
      amount: pricingQuote.totalAmount,
      currency: pricingQuote.currency,
      language: payload.language,
    }),
  };
}

export function isSubmissionEditable(record) {
  return OWNER_EDITABLE_SUBMISSION_STATUSES.includes(record?.submission_status);
}

export function createSubmissionUpdatePatch(payload, currentStatus) {
  const guideDayCount = getGuideDayCountFromAnswers(payload.answers);
  const pricingQuote = getGuidePricingQuote({
    guideDayCount,
    language: payload.language,
  });

  return {
    language: payload.language,
    contact_email: payload.contactEmail,
    applicant_name: payload.applicantName || null,
    answers: payload.answers,
    summary: payload.summary,
    submission_status: currentStatus,
    payment_method: getPaymentMethodForLanguage(payload.language),
    payment_provider_order_id: currentStatus === "paid" ? undefined : null,
    payment_provider_capture_id: currentStatus === "paid" ? undefined : null,
    paid_at: currentStatus === "paid" ? undefined : null,
    payment_completed_email_sent_at: currentStatus === "paid" ? undefined : null,
    payment_completed_email_error: currentStatus === "paid" ? undefined : null,
    guide_day_count: guideDayCount,
    quoted_amount: pricingQuote.totalAmount,
    quoted_currency: pricingQuote.currency,
    quoted_display_label: formatPaymentDisplayLabel({
      amount: pricingQuote.totalAmount,
      currency: pricingQuote.currency,
      language: payload.language,
    }),
  };
}

export function validateAdminSubmissionStatusUpdatePayload(payload) {
  const submissionStatus =
    typeof payload?.submissionStatus === "string"
      ? payload.submissionStatus.trim()
      : "";

  if (!ADMIN_MUTABLE_SUBMISSION_STATUSES.includes(submissionStatus)) {
    throw createHttpError(
      400,
      `submissionStatus must be one of: ${ADMIN_MUTABLE_SUBMISSION_STATUSES.join(", ")}.`,
    );
  }

  return {
    submissionStatus,
  };
}

export function getAllowedAdminSubmissionStatuses(currentStatus) {
  return ADMIN_STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function serializeSubmission(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.user_id ?? null,
    language: record.language,
    contactEmail: record.contact_email,
    applicantName: record.applicant_name ?? "",
    answers: record.answers,
    summary: sanitizeSummary(record.summary),
    submissionStatus: record.submission_status,
    guideDayCount: record.guide_day_count,
    paymentMethod: record.payment_method ?? getPaymentMethodForLanguage(record.language),
    paymentProviderOrderId: record.payment_provider_order_id ?? null,
    paymentProviderCaptureId: record.payment_provider_capture_id ?? null,
    quotedAmount: record.quoted_amount,
    quotedCurrency: record.quoted_currency,
    quotedDisplayLabel: record.quoted_display_label,
    isEditable: isSubmissionEditable(record),
    emailSentAt: record.email_sent_at,
    emailSendError: record.email_send_error,
    paymentCompletedEmailSentAt: record.payment_completed_email_sent_at ?? null,
    paymentCompletedEmailError: record.payment_completed_email_error ?? null,
    paidAt: record.paid_at ?? null,
    submittedAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function formatSummaryAsText(summary) {
  return sanitizeSummary(summary)
    .map((item) => `${item.label}: ${item.value}`)
    .join("\n");
}
