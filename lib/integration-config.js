function readOptionalEnv(name) {
  const value = process.env[name];

  return typeof value === "string" ? value.trim() : "";
}

function parseEmailList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createConfigurationError(message, missingKeys = []) {
  const error = new Error(message);
  error.name = "ConfigurationError";
  error.missingKeys = missingKeys;

  return error;
}

export function getNotificationEmail() {
  return parseEmailList(readOptionalEnv("NOTIFICATION_EMAIL"));
}

export function isSupabaseConfigured() {
  return Boolean(
      readOptionalEnv("SUPABASE_URL") && readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

function readSupabaseUrl() {
  return readOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || readOptionalEnv("SUPABASE_URL");
}

function readSupabaseAnonKey() {
  return (
    readOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readOptionalEnv("SUPABASE_ANON_KEY")
  );
}

export function getSupabaseConfig() {
  const url = readSupabaseUrl();
  const serviceRoleKey = readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  const missingKeys = [];

  if (!url) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    missingKeys.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missingKeys.length > 0) {
    throw createConfigurationError(
      "Supabase server configuration is missing.",
      missingKeys,
    );
  }

  return { url, serviceRoleKey };
}

export function getSupabaseAuthConfig() {
  const url = readSupabaseUrl();
  const anonKey = readSupabaseAnonKey();
  const missingKeys = [];

  if (!url) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  if (!anonKey) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");
  }

  if (missingKeys.length > 0) {
    throw createConfigurationError(
      "Supabase auth configuration is missing.",
      missingKeys,
    );
  }

  return { url, anonKey };
}

export function isResendConfigured() {
  const notificationEmails = parseEmailList(readOptionalEnv("NOTIFICATION_EMAIL"));

  return Boolean(
    readOptionalEnv("RESEND_API_KEY") &&
      readOptionalEnv("EMAIL_FROM") &&
      notificationEmails.length > 0,
  );
}

export function getResendConfig() {
  const apiKey = readOptionalEnv("RESEND_API_KEY");
  const emailFrom = readOptionalEnv("EMAIL_FROM");
  const notificationEmails = parseEmailList(readOptionalEnv("NOTIFICATION_EMAIL"));
  const missingKeys = [];

  if (!apiKey) {
    missingKeys.push("RESEND_API_KEY");
  }

  if (!emailFrom) {
    missingKeys.push("EMAIL_FROM");
  }

  if (notificationEmails.length === 0) {
    missingKeys.push("NOTIFICATION_EMAIL");
  }

  if (missingKeys.length > 0) {
    throw createConfigurationError(
      "Resend configuration is missing.",
      missingKeys,
    );
  }

  return {
    apiKey,
    emailFrom,
    notificationEmails,
  };
}

export { createConfigurationError };
