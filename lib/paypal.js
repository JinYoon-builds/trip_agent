import { getPayPalConfig } from "./integration-config";

async function getPayPalAccessToken() {
  const config = getPayPalConfig();
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok || !data?.access_token) {
    const error = new Error(
      data?.error_description || data?.error || "Failed to fetch PayPal access token.",
    );

    error.status = response.status || 502;
    throw error;
  }

  return data.access_token;
}

async function paypalRequest(path, { method = "GET", body, accessToken }) {
  const { baseUrl } = getPayPalConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.details?.[0]?.description || "PayPal request failed.",
    );

    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createPayPalOrder({ submissionId }) {
  const config = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();
  const order = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    accessToken,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: submissionId,
          custom_id: submissionId,
          description: config.orderDescription,
          amount: {
            currency_code: config.orderCurrency,
            value: config.orderAmount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "TripAgent",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    },
  });

  return {
    order,
    config,
  };
}

export async function capturePayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();

  return paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    accessToken,
  });
}

export function extractApproveLink(order) {
  return order?.links?.find((item) => item.rel === "approve")?.href ?? null;
}

export function extractCaptureDetails(captureResult) {
  const purchaseUnit = captureResult?.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];

  return {
    orderId: captureResult?.id ?? "",
    captureId: capture?.id ?? "",
    status: capture?.status ?? captureResult?.status ?? "",
    amount: capture?.amount?.value ?? purchaseUnit?.amount?.value ?? null,
    currency:
      capture?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code ?? null,
  };
}
