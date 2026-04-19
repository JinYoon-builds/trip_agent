import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../lib/api-error-response";
import {
  requireAuthenticatedUser,
  requireVerifiedUser,
} from "../../../lib/request-auth";
import {
  createSubmissionInsert,
  serializeSubmission,
  validateSubmissionPayload,
} from "../../../lib/submission-utils";
import {
  createSurveySubmission,
  listSurveySubmissionsByUserId,
} from "../../../lib/supabase-admin";

export const runtime = "nodejs";

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(request) {
  try {
    const { user } = await requireAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInteger(searchParams.get("limit"), 100);
    const offset = parsePositiveInteger(searchParams.get("offset"), 0);
    const submissions = await listSurveySubmissionsByUserId(user.id, {
      limit: Math.min(limit, 200),
      offset,
    });

    return NextResponse.json({
      submissions: submissions.map((submission) => serializeSubmission(submission)),
      limit: Math.min(limit, 200),
      offset,
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to fetch survey submissions.");
  }
}

export async function POST(request) {
  try {
    const { user } = await requireVerifiedUser(request);
    const body = await request.json();
    const payload = validateSubmissionPayload(body);
    const submission = await createSurveySubmission({
      ...createSubmissionInsert(payload),
      user_id: user.id,
    });

    return NextResponse.json(
      {
        submission: serializeSubmission(submission),
        emailSent: false,
        emailSendError: null,
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
