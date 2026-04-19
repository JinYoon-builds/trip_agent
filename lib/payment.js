import { normalizeSiteLanguage } from "./language";

export const PAYMENT_METHOD_MANUAL_QR = "manual_qr";
export const PAYMENT_METHOD_PAYPAL = "paypal";

export function getPaymentMethodForLanguage(language) {
  const normalizedLanguage = normalizeSiteLanguage(language);

  return normalizedLanguage === "zh"
    ? PAYMENT_METHOD_MANUAL_QR
    : PAYMENT_METHOD_PAYPAL;
}

export function isManualQrPaymentMethod(paymentMethod) {
  return paymentMethod === PAYMENT_METHOD_MANUAL_QR;
}

export function isPayPalPaymentMethod(paymentMethod) {
  return paymentMethod === PAYMENT_METHOD_PAYPAL;
}
