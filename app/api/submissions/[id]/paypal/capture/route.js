import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../../../lib/api-error-response";
import { createHttpError } from "../../../../../../lib/http-errors";
import { isPayPalConfigured } from "../../../../../../lib/integration-config";
import { finalizePaidSubmission } from "../../../../../../lib/payment-completion";
import {
  capturePayPalOrder,
  extractCompletedPayPalCapture,
  fetchPayPalOrder,
} from "../../../../../../lib/paypal";
import {
  getPaymentMethodForLanguage,
  isPayPalPaymentMethod,
} from "../../../../../../lib/payment";
import { requireSubmissionAccess } from "../../../../../../lib/request-auth";
import { serializeSubmission } from "../../../../../../lib/submission-utils";
import { getSurveySubmissionById } from "../../../../../../lib/supabase-admin";

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
      throw createHttpError(409, "PayPal capture is not available for this submission.");
    }

    const body = await request.json();
    const orderId =
      typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      throw createHttpError(400, "orderId is required.");
    }

    if (!submission.payment_provider_order_id) {
      throw createHttpError(
        409,
        "This submission does not have an active PayPal order. Create a new order before capturing.",
      );
    }

    if (submission.payment_provider_order_id !== orderId) {
      throw createHttpError(409, "PayPal order does not match this submission.");
    }

    if (submission.submission_status === "paid") {
      const result = await finalizePaidSubmission(submission);

      return NextResponse.json({
        submission: serializeSubmission(result.submission),
        paymentCompletedEmailSent: result.paymentCompletedEmailSent,
        paymentCompletedEmailError: result.paymentCompletedEmailError,
      });
    }

    let orderData = null;

    try {
      orderData = await capturePayPalOrder(orderId);
    } catch (error) {
      const recoveredOrder = await fetchPayPalOrder(orderId).catch(() => null);

      if (!recoveredOrder || recoveredOrder.status !== "COMPLETED") {
        throw error;
      }

      orderData = recoveredOrder;
    }
    const capture = extractCompletedPayPalCapture(orderData);

    const matchesSubmissionId =
      capture.referenceId === submission.id || capture.customId === submission.id;

    if (!matchesSubmissionId) {
      throw createHttpError(
        409,
        "PayPal capture does not belong to this submission.",
      );
    }

    const normalizedQuotedAmount = Number(submission.quoted_amount ?? submission.quotedAmount)
      .toFixed(2);

    if (
      capture.amountCurrencyCode !== submission.quoted_currency ||
      capture.amountValue !== normalizedQuotedAmount
    ) {
      throw createHttpError(
        409,
        "PayPal capture amount does not match this submission quote.",
      );
    }

    const result = await finalizePaidSubmission(submission, {
      payment_method: paymentMethod,
      payment_provider_order_id: capture.orderId || orderId,
      payment_provider_capture_id: capture.captureId,
    });

    return NextResponse.json({
      submission: serializeSubmission(result.submission),
      paymentCompletedEmailSent: result.paymentCompletedEmailSent,
      paymentCompletedEmailError: result.paymentCompletedEmailError,
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to capture PayPal order.");
  }
}
