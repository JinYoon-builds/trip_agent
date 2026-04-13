import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../lib/api-error-response";
import {
  createSubmissionInsert,
  serializeSubmission,
  validateSubmissionPayload,
} from "../../../lib/submission-utils";
import { createSurveySubmission } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = validateSubmissionPayload(body);
    const submission = await createSurveySubmission(createSubmissionInsert(payload));

    return NextResponse.json(
      {
        submission: serializeSubmission(submission),
      },
      { status: 201 },
    );
  } catch (error) {
    return buildApiErrorResponse(
      error,
      "Failed to create survey submission.",
    );
  }
}
