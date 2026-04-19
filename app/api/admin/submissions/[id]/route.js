import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../../lib/api-error-response";
import { createHttpError } from "../../../../../lib/http-errors";
import { finalizePaidSubmission } from "../../../../../lib/payment-completion";
import { requireAdmin } from "../../../../../lib/request-auth";
import {
  getAllowedAdminSubmissionStatuses,
  serializeSubmission,
  validateAdminSubmissionStatusUpdatePayload,
} from "../../../../../lib/submission-utils";
import {
  getSurveySubmissionById,
  updateSurveySubmission,
} from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request, context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const submission = await getSurveySubmissionById(id);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    return NextResponse.json({
      submission: serializeSubmission(submission),
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to fetch submission.");
  }
}

export async function PATCH(request, context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const submission = await getSurveySubmissionById(id);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    const body = await request.json();
    const payload = validateAdminSubmissionStatusUpdatePayload(body);
    const allowedNextStatuses = getAllowedAdminSubmissionStatuses(
      submission.submission_status,
    );

    if (!allowedNextStatuses.includes(payload.submissionStatus)) {
      throw createHttpError(
        409,
        `Status transition from ${submission.submission_status} to ${payload.submissionStatus} is not allowed.`,
      );
    }

    const result =
      payload.submissionStatus === "paid"
        ? await finalizePaidSubmission(submission)
        : {
            submission: await updateSurveySubmission(id, {
              submission_status: payload.submissionStatus,
            }),
          };

    return NextResponse.json({
      submission: serializeSubmission(result.submission),
      paymentCompletedEmailSent: result.paymentCompletedEmailSent ?? false,
      paymentCompletedEmailError: result.paymentCompletedEmailError ?? null,
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to update submission.");
  }
}
