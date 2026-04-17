import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { createHttpError } from "../../../../lib/http-errors";
import { requireAdmin } from "../../../../lib/request-auth";
import { serializeSubmission } from "../../../../lib/submission-utils";
import { listSurveySubmissions } from "../../../../lib/supabase-admin";

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
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInteger(searchParams.get("limit"), 100);
    const offset = parsePositiveInteger(searchParams.get("offset"), 0);

    if (limit > 200) {
      throw createHttpError(400, "limit must be 200 or less.");
    }

    const submissions = await listSurveySubmissions({ limit, offset });

    return NextResponse.json({
      submissions: submissions.map((submission) => serializeSubmission(submission)),
      limit,
      offset,
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to fetch submissions.");
  }
}
