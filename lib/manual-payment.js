function readPublicEnv(name, fallback = "") {
  const value = process.env[name];

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed || fallback;
}

export const MANUAL_PAYMENT_METHOD = "WeChat Pay";

export const MANUAL_PAYMENT_QR_IMAGE =
  readPublicEnv(
    "NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE",
    "/manual-payment-qr.png",
  );
