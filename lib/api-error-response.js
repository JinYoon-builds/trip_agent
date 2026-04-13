import { NextResponse } from "next/server";

export function buildApiErrorResponse(error, fallbackMessage) {
  const message =
    typeof error?.message === "string" && error.message.trim()
      ? error.message
      : fallbackMessage;

  if (error?.name === "ConfigurationError") {
    return NextResponse.json(
      {
        error: message,
        missingKeys: error.missingKeys ?? [],
      },
      { status: 503 },
    );
  }

  if (typeof error?.status === "number") {
    return NextResponse.json({ error: message }, { status: error.status });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}
