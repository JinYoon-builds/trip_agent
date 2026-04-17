import { createHttpError } from "./http-errors";
import { getSupabaseAuthConfig } from "./integration-config";
import { getProfileById } from "./supabase-admin";

function parseCookieTokenValue(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const candidates = [value];

  try {
    candidates.push(decodeURIComponent(value));
  } catch {}

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return parsed[0].trim();
      }

      if (typeof parsed?.access_token === "string") {
        return parsed.access_token.trim();
      }

      if (typeof parsed?.currentSession?.access_token === "string") {
        return parsed.currentSession.access_token.trim();
      }
    } catch {}
  }

  return value.trim();
}

function readBearerToken(request) {
  const authorization = request.headers.get("authorization")?.trim() || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function readCookieToken(request) {
  const directCookieNames = [
    "sb-access-token",
    "supabase-access-token",
    "access-token",
  ];

  for (const cookieName of directCookieNames) {
    const value = request.cookies.get(cookieName)?.value;
    const token = parseCookieTokenValue(value);

    if (token) {
      return token;
    }
  }

  const authCookie = request.cookies
    .getAll()
    .find((cookie) => /^sb-[^-]+-auth-token(?:\.\d+)?$/.test(cookie.name));

  return parseCookieTokenValue(authCookie?.value);
}

async function fetchAuthenticatedUser(accessToken) {
  const { url, anonKey } = getSupabaseAuthConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw createHttpError(401, "Authentication is required.");
  }

  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : null;

  if (!response.ok || !data?.id) {
    throw createHttpError(401, "Authentication is required.");
  }

  return data;
}

export function getRequestAccessToken(request) {
  return readBearerToken(request) || readCookieToken(request);
}

export async function getAuthenticatedUser(request) {
  const accessToken = getRequestAccessToken(request);

  if (!accessToken) {
    throw createHttpError(401, "Authentication is required.");
  }

  const user = await fetchAuthenticatedUser(accessToken);

  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email.trim() : "",
    emailConfirmedAt:
      typeof user.email_confirmed_at === "string"
        ? user.email_confirmed_at
        : null,
    isEmailVerified: Boolean(user.email_confirmed_at),
  };
}

export async function getCurrentProfile(request) {
  const user = await getAuthenticatedUser(request);
  const profile = await getProfileById(user.id);

  if (!profile) {
    throw createHttpError(403, "Profile not found for authenticated user.");
  }

  return { user, profile };
}

export async function requireAdmin(request) {
  const auth = await getCurrentProfile(request);

  if (!auth.user.isEmailVerified) {
    throw createHttpError(403, "Verified email is required.");
  }

  if (auth.profile.role !== "admin") {
    throw createHttpError(403, "Administrator access is required.");
  }

  return auth;
}

export async function requireAuthenticatedUser(request) {
  return getCurrentProfile(request);
}

export async function requireVerifiedUser(request) {
  const auth = await getCurrentProfile(request);

  if (!auth.user.isEmailVerified) {
    throw createHttpError(403, "Email verification is required.");
  }

  return auth;
}

export function canAccessSubmission({ profile, user }, submission) {
  if (profile.role === "admin") {
    return true;
  }

  return Boolean(submission?.user_id && submission.user_id === user.id);
}

export async function requireSubmissionAccess(request, submission) {
  const auth = await getCurrentProfile(request);

  if (canAccessSubmission(auth, submission)) {
    return auth;
  }

  throw createHttpError(404, "Submission not found.");
}
