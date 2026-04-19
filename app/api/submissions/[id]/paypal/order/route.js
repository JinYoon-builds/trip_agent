import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../../../lib/api-error-response";
import { createHttpError } from "../../../../../../lib/http-errors";
import { isPayPalConfigured } from "../../../../../../lib/integration-config";
import { createPayPalOrder } from "../../../../../../lib/paypal";
import {
  getPaymentMethodForLanguage,
  isPayPalPaymentMethod,
} from "../../../../../../lib/payment";
import { requireSubmissionAccess } from "../../../../../../lib/request-auth";
import {
  formatPaymentDisplayLabel,
  getGuidePricingQuote,
} from "../../../../../../lib/pricing";
import {
  isSubmissionEditable,
  serializeSubmission,
} from "../../../../../../lib/submission-utils";
import {
  getSurveySubmissionById,
  updateSurveySubmission,
} from "../../../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request, context) {
  try {
    if (!isPayPalConfigured()) {
      throw createHttpError(503, "PayPal configuration is missing.");
    }

    const { id } = await context.params;
    const submission = await getSurveySubmissionById(id);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    await requireSubmissionAccess(request, submission);

    const paymentMethod =
      submission.payment_method || getPaymentMethodForLanguage(submission.language);

    if (!isPayPalPaymentMethod(paymentMethod)) {
      throw createHttpError(
        409,
        "PayPal checkout is only available for Korean and English submissions.",
      );
    }

    if (!isSubmissionEditable(submission)) {
      throw createHttpError(
        409,
        "This submission cannot start a new PayPal checkout.",
      );
    }

    const pricingQuote = getGuidePricingQuote({
      guideDayCount: submission.guide_day_count,
      language: submission.language,
    });

    if (pricingQuote.currency !== "USD") {
      throw createHttpError(409, "PayPal checkout requires a USD quote.");
    }

    const order = await createPayPalOrder({
      amount: pricingQuote.totalAmount,
      submissionId: submission.id,
    });
    const updatedSubmission = await updateSurveySubmission(submission.id, {
      payment_method: paymentMethod,
      payment_provider_order_id: order.id,
      quoted_amount: pricingQuote.totalAmount,
      quoted_currency: pricingQuote.currency,
      quoted_display_label: formatPaymentDisplayLabel({
        amount: pricingQuote.totalAmount,
        currency: pricingQuote.currency,
        language: submission.language,
      }),
    });

    return NextResponse.json({
      orderId: order.id,
      submission: serializeSubmission(updatedSubmission),
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to create PayPal order.");
  }
}
