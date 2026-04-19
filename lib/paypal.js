import { createHttpError } from "./http-errors";
import { getPayPalServerConfig } from "./integration-config";

export const PAYPAL_CHECKOUT_CURRENCY = "USD";
export const PAYPAL_BRAND_NAME = "刘Unnie";
export const PAYPAL_ITEM_DESCRIPTION = "Local Student Guide Service";

function getPayPalApiBase(env) {
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function createPayPalRequestError(message, details, status = 502) {
  const error = createHttpError(status, message);
  error.details = details;

  return error;
}

async function readPayPalResponse(response, fallbackMessage) {
  const rawText = await response.text();
  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw createPayPalRequestError(
      data?.message || fallbackMessage,
      data,
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }

  return data;
}

export async function generatePayPalAccessToken() {
  const { env, clientId, clientSecret } = getPayPalServerConfig();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalApiBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en_US",
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }).toString(),
    cache: "no-store",
  });
  const data = await readPayPalResponse(
    response,
    "Failed to generate PayPal access token.",
  );

  if (typeof data?.access_token !== "string" || !data.access_token.trim()) {
    throw createPayPalRequestError(
      "PayPal access token response is invalid.",
      data,
    );
  }

  return {
    accessToken: data.access_token.trim(),
    apiBase: getPayPalApiBase(env),
  };
}

export async function createPayPalOrder({
  amount,
  submissionId,
}) {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw createPayPalRequestError(
      "PayPal order amount must be a positive number.",
      { amount },
      400,
    );
  }

  const { accessToken, apiBase } = await generatePayPalAccessToken();
  const response = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: submissionId,
          custom_id: submissionId,
          description: PAYPAL_ITEM_DESCRIPTION,
          amount: {
            currency_code: PAYPAL_CHECKOUT_CURRENCY,
            value: parsedAmount.toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: PAYPAL_BRAND_NAME,
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    }),
    cache: "no-store",
  });
  const data = await readPayPalResponse(
    response,
    "Failed to create PayPal order.",
  );

  if (typeof data?.id !== "string" || !data.id.trim()) {
    throw createPayPalRequestError(
      "PayPal order response is missing an order ID.",
      data,
    );
  }

  return data;
}

export async function capturePayPalOrder(orderId) {
  if (typeof orderId !== "string" || !orderId.trim()) {
    throw createPayPalRequestError(
      "PayPal order ID is required for capture.",
      { orderId },
      400,
    );
  }

  const normalizedOrderId = orderId.trim();
  const { accessToken, apiBase } = await generatePayPalAccessToken();
  const response = await fetch(
    `${apiBase}/v2/checkout/orders/${normalizedOrderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );
  const data = await readPayPalResponse(
    response,
    "Failed to capture PayPal order.",
  );

  return data;
}

export async function fetchPayPalOrder(orderId) {
  if (typeof orderId !== "string" || !orderId.trim()) {
    throw createPayPalRequestError(
      "PayPal order ID is required.",
      { orderId },
      400,
    );
  }

  const normalizedOrderId = orderId.trim();
  const { accessToken, apiBase } = await generatePayPalAccessToken();
  const response = await fetch(`${apiBase}/v2/checkout/orders/${normalizedOrderId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return readPayPalResponse(response, "Failed to fetch PayPal order.");
}

export function extractCompletedPayPalCapture(orderData) {
  const purchaseUnit = orderData?.purchase_units?.[0] ?? null;
  const capture =
    purchaseUnit?.payments?.captures?.[0] ?? null;

  if (
    orderData?.status !== "COMPLETED" ||
    capture?.status !== "COMPLETED" ||
    typeof capture?.id !== "string" ||
    !capture.id.trim()
  ) {
    throw createPayPalRequestError(
      "PayPal order capture did not complete successfully.",
      orderData,
    );
  }

  return {
    captureId: capture.id.trim(),
    orderId:
      typeof orderData?.id === "string" ? orderData.id.trim() : "",
    amountCurrencyCode:
      typeof capture?.amount?.currency_code === "string"
        ? capture.amount.currency_code.trim()
        : "",
    amountValue:
      typeof capture?.amount?.value === "string"
        ? capture.amount.value.trim()
        : "",
    referenceId:
      typeof purchaseUnit?.reference_id === "string"
        ? purchaseUnit.reference_id.trim()
        : "",
    customId:
      typeof purchaseUnit?.custom_id === "string"
        ? purchaseUnit.custom_id.trim()
        : typeof capture?.custom_id === "string"
          ? capture.custom_id.trim()
        : "",
    payer:
      orderData?.payment_source?.paypal ?? null,
  };
}
