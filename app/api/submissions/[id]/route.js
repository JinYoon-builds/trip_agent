import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { createHttpError } from "../../../../lib/http-errors";
import { requireSubmissionAccess } from "../../../../lib/request-auth";
import { serializeSubmission } from "../../../../lib/submission-utils";
import { getSurveySubmissionById } from "../../../../lib/supabase-admin";

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
