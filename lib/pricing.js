import { normalizeSiteLanguage } from "./language";

export const GUIDE_DAY_BASE_RATE = 89;
export const GUIDE_PRICE_CURRENCY = "USD";

const PRICE_LOCALES = {
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
};

function normalizeGuideDates(guideDates) {
  if (!Array.isArray(guideDates)) {
    return [];
  }

  return guideDates.filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function getGuideDatesFromAnswers(answers) {
  return normalizeGuideDates(answers?.guideDates);
}

export function getGuideDayCountFromAnswers(answers) {
  const guideDates = getGuideDatesFromAnswers(answers);

  return guideDates.length > 0 ? guideDates.length : 1;
}

export function getGuideDiscountRate(guideDayCount) {
  const parsedDayCount = Number(guideDayCount);

  if (!Number.isInteger(parsedDayCount) || parsedDayCount <= 0) {
    throw new Error("Guide day count must be a positive integer.");
  }

  if (parsedDayCount >= 3) {
    return 0.2;
  }

  if (parsedDayCount === 2) {
    return 0.1;
  }

  return 0;
}

export function getGuidePricingQuote({ guideDayCount }) {
  const parsedDayCount = Number(guideDayCount);

  if (!Number.isInteger(parsedDayCount) || parsedDayCount <= 0) {
    throw new Error("Guide day count must be a positive integer.");
  }

  const discountRate = getGuideDiscountRate(parsedDayCount);
  const subtotalAmount = GUIDE_DAY_BASE_RATE * parsedDayCount;
  const totalAmount = subtotalAmount * (1 - discountRate);
  const discountAmount = subtotalAmount - totalAmount;

  return {
    guideDayCount: parsedDayCount,
    baseRate: GUIDE_DAY_BASE_RATE,
    currency: GUIDE_PRICE_CURRENCY,
    discountRate,
    discountPercent: Math.round(discountRate * 100),
    subtotalAmount: subtotalAmount.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}

export function formatPaymentDisplayLabel({ amount, currency, language }) {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || !currency) {
    return "";
  }

  const normalizedLanguage = normalizeSiteLanguage(language);
  const locale = PRICE_LOCALES[normalizedLanguage] ?? PRICE_LOCALES.en;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || GUIDE_PRICE_CURRENCY,
      currencyDisplay: "code",
      minimumFractionDigits: Number.isInteger(parsedAmount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(parsedAmount);
  } catch {
    return `${currency || GUIDE_PRICE_CURRENCY} ${parsedAmount
      .toFixed(2)
      .replace(/\.00$/, "")}`;
  }
}
