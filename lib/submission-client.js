function createClientError(message, status, missingKeys) {
  const error = new Error(message);

  if (typeof status === "number") {
    error.status = status;
  }

  if (Array.isArray(missingKeys) && missingKeys.length > 0) {
    error.missingKeys = missingKeys;
  }

  return error;
}

async function parseJson(response) {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

export async function createRemoteSubmission(payload) {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to create survey submission.",
      response.status,
      data?.missingKeys,
    );
  }

  return data?.submission ?? null;
}

export async function fetchRemoteSubmission(submissionId) {
  const response = await fetch(`/api/submissions/${submissionId}`, {
    cache: "no-store",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to fetch survey submission.",
      response.status,
      data?.missingKeys,
    );
  }

  return data?.submission ?? null;
}

export async function createRemotePayPalOrder(submissionId) {
  const response = await fetch("/api/paypal/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ submissionId }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to create PayPal order.",
      response.status,
      data?.missingKeys,
    );
  }

  return data;
}

export async function captureRemotePayPalOrder(submissionId, orderId) {
  const response = await fetch("/api/paypal/capture-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submissionId,
      orderId,
    }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to capture PayPal order.",
      response.status,
      data?.missingKeys,
    );
  }

  return data;
}
