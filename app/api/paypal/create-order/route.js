import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { getPaymentDisplayLabel } from "../../../../lib/integration-config";
import { createHttpError } from "../../../../lib/http-errors";
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

    const { order, config } = await createPayPalOrder({ submissionId });

    await updateSurveySubmission(submissionId, {
      paypal_order_id: order.id,
      payment_amount: config.orderAmount,
      payment_currency: config.orderCurrency,
      payment_display_label: getPaymentDisplayLabel(),
      payment_status: "payment_created",
    });

    return NextResponse.json({
      orderId: order.id,
      approveLink: extractApproveLink(order),
      amount: config.orderAmount,
      currency: config.orderCurrency,
      displayLabel: getPaymentDisplayLabel(),
    });
  } catch (error) {
    return buildApiErrorResponse(
      error,
      "Failed to create PayPal order.",
    );
  }
}
