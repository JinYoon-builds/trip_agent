import { getSupabaseConfig } from "./integration-config";

const TABLE_NAME = "survey_submissions";
const PROFILES_TABLE_NAME = "profiles";

async function supabaseAdminRequest(path, { method = "GET", body, headers } = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.hint ||
        `Supabase request failed with status ${response.status}.`,
    );

    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createSurveySubmission(record) {
  const data = await supabaseAdminRequest(TABLE_NAME, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: record,
  });

  return Array.isArray(data) ? data[0] : data;
}

export async function listSurveySubmissions({ limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
    limit: String(limit),
    offset: String(offset),
  });
  const data = await supabaseAdminRequest(`${TABLE_NAME}?${params.toString()}`);

  return Array.isArray(data) ? data : [];
}

export async function listSurveySubmissionsByUserId(userId, { limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams({
    select: "*",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: String(limit),
    offset: String(offset),
  });
  const data = await supabaseAdminRequest(`${TABLE_NAME}?${params.toString()}`);

  return Array.isArray(data) ? data : [];
}

export async function getSurveySubmissionById(id) {
  const params = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });
  const data = await supabaseAdminRequest(`${TABLE_NAME}?${params.toString()}`);

  return Array.isArray(data) ? data[0] ?? null : data;
}

export async function getProfileById(id) {
  const params = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });
  const data = await supabaseAdminRequest(`${PROFILES_TABLE_NAME}?${params.toString()}`);

  return Array.isArray(data) ? data[0] ?? null : data;
}

export async function updateSurveySubmission(id, patch) {
  const data = await supabaseAdminRequest(
    `${TABLE_NAME}?${new URLSearchParams({ id: `eq.${id}` }).toString()}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        ...patch,
        updated_at: new Date().toISOString(),
      },
    },
  );

  return Array.isArray(data) ? data[0] ?? null : data;
}
