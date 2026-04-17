import { getCurrentAccessToken } from "./supabase-browser";

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

async function createAuthHeaders(headers = {}) {
  const accessToken = await getCurrentAccessToken().catch(() => "");

  if (!accessToken) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${accessToken}`,
  };
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
  const headers = await createAuthHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers,
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
  const headers = await createAuthHeaders();
  const response = await fetch(`/api/submissions/${submissionId}`, {
    cache: "no-store",
    headers,
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

export async function fetchRemoteSubmissions() {
  const headers = await createAuthHeaders();
  const response = await fetch("/api/submissions", {
    cache: "no-store",
    headers,
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to fetch survey submissions.",
      response.status,
      data?.missingKeys,
    );
  }

  return data?.submissions ?? [];
}

export async function updateRemoteSubmission(submissionId, payload) {
  const headers = await createAuthHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetch(`/api/submissions/${submissionId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to update survey submission.",
      response.status,
      data?.missingKeys,
    );
  }

  return data?.submission ?? null;
}

export async function fetchAdminSubmission(submissionId) {
  const headers = await createAuthHeaders();
  const response = await fetch(`/api/admin/submissions/${submissionId}`, {
    cache: "no-store",
    headers,
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to fetch admin submission.",
      response.status,
      data?.missingKeys,
    );
  }

  return data?.submission ?? null;
}

export async function updateAdminSubmissionStatus(submissionId, submissionStatus) {
  const headers = await createAuthHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetch(`/api/admin/submissions/${submissionId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      submissionStatus,
    }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw createClientError(
      data?.error || "Failed to update admin submission.",
      response.status,
      data?.missingKeys,
    );
  }

  return data?.submission ?? null;
}
