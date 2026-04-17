import { NextResponse } from "next/server";

import { buildApiErrorResponse } from "../../../../lib/api-error-response";
import { getCurrentProfile } from "../../../../lib/request-auth";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { user, profile } = await getCurrentProfile(request);

    return NextResponse.json({
      user,
      profile,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    return buildApiErrorResponse(error, "Failed to load current session.");
  }
}
