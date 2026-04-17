import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { createHttpError } from "../../../../lib/http-errors";
import { requireSubmissionAccess } from "../../../../lib/request-auth";
import {
  createSubmissionUpdatePatch,
  isSubmissionEditable,
  serializeSubmission,
  validateSubmissionPayload,
} from "../../../../lib/submission-utils";
import {
  getSurveySubmissionById,
  updateSurveySubmission,
} from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    const submission = await getSurveySubmissionById(id);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    await requireSubmissionAccess(_request, submission);

    return NextResponse.json({
      submission: serializeSubmission(submission),
    });
  } catch (error) {
    return buildApiErrorResponse(
      error,
      "Failed to fetch survey submission.",
    );
  }
}

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const submission = await getSurveySubmissionById(id);

    if (!submission) {
      throw createHttpError(404, "Submission not found.");
    }

    const auth = await requireSubmissionAccess(request, submission);

    if (auth.profile.role === "admin") {
      throw createHttpError(403, "Administrators must use the admin submission API.");
    }

    if (!isSubmissionEditable(submission)) {
      throw createHttpError(409, "Paid submissions can no longer be edited.");
    }

    const body = await request.json();
    const payload = validateSubmissionPayload(body);
    const updatedSubmission = await updateSurveySubmission(
      submission.id,
      createSubmissionUpdatePatch(payload, submission.submission_status),
    );

    return NextResponse.json({
      submission: serializeSubmission(updatedSubmission),
    });
  } catch (error) {
    return buildApiErrorResponse(
      error,
      "Failed to update survey submission.",
    );
  }
}
