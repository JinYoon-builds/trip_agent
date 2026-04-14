import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { createHttpError } from "../../../../lib/http-errors";
import {
  formatPaymentDisplayLabel,
  getGuideDayCountFromAnswers,
  getGuidePricingQuote,
} from "../../../../lib/pricing";
import { createPayPalOrder, extractApproveLink } from "../../../../lib/paypal";
import {
  getSurveySubmissionById,
  updateSurveySubmission,
} from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const submissionId =
      typeof body?.submissionId === "string" ? body.submissionId.trim() : "";

    if (!submissionId) {
      throw createHttpError(400, "submissionId is required.");
    }

    const submission = await getSurveySubmissionById(submissionId);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    const guideDayCount = getGuideDayCountFromAnswers(submission.answers);
    const pricingQuote = getGuidePricingQuote({ guideDayCount });
    const displayLabel = formatPaymentDisplayLabel({
      amount: pricingQuote.totalAmount,
      currency: pricingQuote.currency,
      language: submission.language,
    });
    const dayLabel = guideDayCount === 1 ? "1 guide day" : `${guideDayCount} guide days`;
    const { order } = await createPayPalOrder({
      submissionId,
      amount: pricingQuote.totalAmount,
      description: `lie-unnie private guide matching request (${dayLabel})`,
    });

    await updateSurveySubmission(submissionId, {
      paypal_order_id: order.id,
      payment_amount: pricingQuote.totalAmount,
      payment_currency: pricingQuote.currency,
      payment_display_label: displayLabel,
      payment_status: "payment_created",
    });

    return NextResponse.json({
      orderId: order.id,
      approveLink: extractApproveLink(order),
      amount: pricingQuote.totalAmount,
      currency: pricingQuote.currency,
      displayLabel,
      guideDayCount,
      discountPercent: pricingQuote.discountPercent,
    });
  } catch (error) {
    return buildApiErrorResponse(
      error,
      "Failed to create PayPal order.",
    );
  }
}
