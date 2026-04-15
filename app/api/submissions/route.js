import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../lib/api-error-response";
import { isResendConfigured } from "../../../lib/integration-config";
import { sendSubmissionReceivedNotification } from "../../../lib/resend";
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
    let emailSent = false;
    let emailSendError = null;

    if (isResendConfigured()) {
      try {
        await sendSubmissionReceivedNotification({ submission });
        emailSent = true;
      } catch (error) {
        console.error(error);
        emailSendError =
          typeof error?.message === "string"
            ? error.message
            : "Failed to send notification email.";
      }
    }

    return NextResponse.json(
      {
        submission: serializeSubmission(submission),
        emailSent,
        emailSendError,
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
