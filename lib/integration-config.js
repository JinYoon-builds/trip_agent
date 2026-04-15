import { GUIDE_PRICE_CURRENCY } from "./pricing";

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

export function getSupabaseConfig() {
  const url = readOptionalEnv("SUPABASE_URL");
  const serviceRoleKey = readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  const missingKeys = [];

  if (!url) {
    missingKeys.push("SUPABASE_URL");
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

export function isPayPalConfigured() {
  return Boolean(
    readOptionalEnv("PAYPAL_CLIENT_ID") &&
      readOptionalEnv("PAYPAL_CLIENT_SECRET"),
  );
}

export function getPayPalConfig() {
  const clientId = readOptionalEnv("PAYPAL_CLIENT_ID");
  const clientSecret = readOptionalEnv("PAYPAL_CLIENT_SECRET");
  const orderDescription =
    readOptionalEnv("PAYPAL_ORDER_DESCRIPTION") ||
    "liu-unnie private guide matching request";
  const env = readOptionalEnv("PAYPAL_ENV") === "live" ? "live" : "sandbox";
  const missingKeys = [];

  if (!clientId) {
    missingKeys.push("PAYPAL_CLIENT_ID");
  }

  if (!clientSecret) {
    missingKeys.push("PAYPAL_CLIENT_SECRET");
  }

  if (missingKeys.length > 0) {
    throw createConfigurationError(
      "PayPal configuration is missing.",
      missingKeys,
    );
  }

  return {
    clientId,
    clientSecret,
    orderCurrency: GUIDE_PRICE_CURRENCY,
    orderDescription,
    env,
    baseUrl:
      env === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  };
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
