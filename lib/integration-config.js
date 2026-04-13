function readOptionalEnv(name) {
  const value = process.env[name];

  return typeof value === "string" ? value.trim() : "";
}

function createConfigurationError(message, missingKeys = []) {
  const error = new Error(message);
  error.name = "ConfigurationError";
  error.missingKeys = missingKeys;

  return error;
}

export function getPaymentDisplayLabel() {
  return readOptionalEnv("PAYMENT_DISPLAY_LABEL") || "₩200,000";
}

export function getNotificationEmail() {
  return readOptionalEnv("NOTIFICATION_EMAIL");
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
      readOptionalEnv("PAYPAL_CLIENT_SECRET") &&
      readOptionalEnv("PAYPAL_ORDER_AMOUNT") &&
      readOptionalEnv("PAYPAL_ORDER_CURRENCY"),
  );
}

export function getPayPalConfig() {
  const clientId = readOptionalEnv("PAYPAL_CLIENT_ID");
  const clientSecret = readOptionalEnv("PAYPAL_CLIENT_SECRET");
  const orderAmount = readOptionalEnv("PAYPAL_ORDER_AMOUNT");
  const orderCurrency = readOptionalEnv("PAYPAL_ORDER_CURRENCY");
  const orderDescription =
    readOptionalEnv("PAYPAL_ORDER_DESCRIPTION") ||
    "TripAgent private guide matching request";
  const env = readOptionalEnv("PAYPAL_ENV") === "live" ? "live" : "sandbox";
  const missingKeys = [];

  if (!clientId) {
    missingKeys.push("PAYPAL_CLIENT_ID");
  }

  if (!clientSecret) {
    missingKeys.push("PAYPAL_CLIENT_SECRET");
  }

  if (!orderAmount) {
    missingKeys.push("PAYPAL_ORDER_AMOUNT");
  }

  if (!orderCurrency) {
    missingKeys.push("PAYPAL_ORDER_CURRENCY");
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
    orderAmount,
    orderCurrency,
    orderDescription,
    env,
    baseUrl:
      env === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  };
}

export function isResendConfigured() {
  return Boolean(
    readOptionalEnv("RESEND_API_KEY") &&
      readOptionalEnv("EMAIL_FROM") &&
      readOptionalEnv("NOTIFICATION_EMAIL"),
  );
}

export function getResendConfig() {
  const apiKey = readOptionalEnv("RESEND_API_KEY");
  const emailFrom = readOptionalEnv("EMAIL_FROM");
  const notificationEmail = readOptionalEnv("NOTIFICATION_EMAIL");
  const missingKeys = [];

  if (!apiKey) {
    missingKeys.push("RESEND_API_KEY");
  }

  if (!emailFrom) {
    missingKeys.push("EMAIL_FROM");
  }

  if (!notificationEmail) {
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
    notificationEmail,
  };
}

export { createConfigurationError };
