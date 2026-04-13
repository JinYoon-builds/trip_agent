import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { isResendConfigured } from "../../../../lib/integration-config";
import { createHttpError } from "../../../../lib/http-errors";
import {
  capturePayPalOrder,
  extractCaptureDetails,
} from "../../../../lib/paypal";
import { sendPaidSubmissionNotification } from "../../../../lib/resend";
import { serializeSubmission } from "../../../../lib/submission-utils";
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
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (!submissionId || !orderId) {
      throw createHttpError(400, "submissionId and orderId are required.");
    }

    const submission = await getSurveySubmissionById(submissionId);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    if (submission.payment_status === "paid") {
      return NextResponse.json({
        submission: serializeSubmission(submission),
        emailSent: Boolean(submission.email_sent_at),
      });
    }

    if (submission.paypal_order_id && submission.paypal_order_id !== orderId) {
      throw createHttpError(409, "PayPal order does not match this submission.");
    }

    const captureResult = await capturePayPalOrder(orderId);
    const captureDetails = extractCaptureDetails(captureResult);
    const paidSubmission = await updateSurveySubmission(submissionId, {
      paypal_order_id: captureDetails.orderId || orderId,
      paypal_capture_id: captureDetails.captureId || null,
      payment_amount: captureDetails.amount,
      payment_currency: captureDetails.currency,
      payment_status:
        captureDetails.status === "COMPLETED" ? "paid" : "payment_pending",
    });

    let emailSent = false;
    let emailSendError = null;

    if (captureDetails.status === "COMPLETED" && isResendConfigured()) {
      try {
        await sendPaidSubmissionNotification({
          submission: paidSubmission,
          captureDetails,
        });
        emailSent = true;
      } catch (error) {
        console.error(error);
        emailSendError =
          typeof error?.message === "string"
            ? error.message
            : "Failed to send notification email.";
      }
    }

    const finalSubmission =
      emailSent || emailSendError
        ? await updateSurveySubmission(submissionId, {
            email_sent_at: emailSent ? new Date().toISOString() : null,
            email_send_error: emailSent ? null : emailSendError,
          })
        : paidSubmission;

    return NextResponse.json({
      submission: serializeSubmission(finalSubmission),
      emailSent,
      emailSendError,
    });
  } catch (error) {
    return buildApiErrorResponse(
      error,
      "Failed to capture PayPal order.",
    );
  }
}
