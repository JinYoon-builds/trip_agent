import { normalizeSiteLanguage } from "./language";

const GUIDE_PRICE_CONFIG = {
  zh: {
    baseRate: 600,
    currency: "CNY",
  },
  ko: {
    baseRate: 50,
    currency: "USD",
  },
  en: {
    baseRate: 50,
    currency: "USD",
  },
};

const PRICE_LOCALES = {
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
};

function getPricingConfig(language) {
  const normalizedLanguage = normalizeSiteLanguage(language);

  return GUIDE_PRICE_CONFIG[normalizedLanguage] ?? GUIDE_PRICE_CONFIG.zh;
}

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

export function getGuideDailyRate(guideDayCount, language) {
  const parsedDayCount = Number(guideDayCount);
  const { baseRate } = getPricingConfig(language);

  if (!Number.isInteger(parsedDayCount) || parsedDayCount <= 0) {
    throw new Error("Guide day count must be a positive integer.");
  }

  if (parsedDayCount >= 3) {
    return Number((baseRate * 0.8).toFixed(2));
  }

  if (parsedDayCount === 2) {
    return Number((baseRate * 0.9).toFixed(2));
  }

  return baseRate;
}

export function getGuidePricingQuote({ guideDayCount, language }) {
  const parsedDayCount = Number(guideDayCount);
  const { baseRate, currency } = getPricingConfig(language);

  if (!Number.isInteger(parsedDayCount) || parsedDayCount <= 0) {
    throw new Error("Guide day count must be a positive integer.");
  }

  const dailyRate = getGuideDailyRate(parsedDayCount, language);
  const discountRate = getGuideDiscountRate(parsedDayCount);
  const subtotalAmount = baseRate * parsedDayCount;
  const totalAmount = dailyRate * parsedDayCount;
  const discountAmount = subtotalAmount - totalAmount;

  return {
    guideDayCount: parsedDayCount,
    baseRate,
    dailyRate,
    currency,
    discountRate,
    discountPercent: Math.round(discountRate * 100),
    subtotalAmount: subtotalAmount.toFixed(currency === "USD" ? 2 : 0),
    discountAmount: discountAmount.toFixed(currency === "USD" ? 2 : 0),
    totalAmount: totalAmount.toFixed(currency === "USD" ? 2 : 0),
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
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: Number.isInteger(parsedAmount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(parsedAmount);
  } catch {
    return `${currency} ${parsedAmount
      .toFixed(2)
      .replace(/\.00$/, "")}`;
  }
}

export function formatDailyRateDisplayLabel({ amount, currency, language }) {
  const amountLabel = formatPaymentDisplayLabel({ amount, currency, language });

  if (!amountLabel) {
    return "";
  }

  const normalizedLanguage = normalizeSiteLanguage(language);

  if (normalizedLanguage === "ko") {
    return `${amountLabel} / 일`;
  }

  if (normalizedLanguage === "zh") {
    return `${amountLabel} / 天`;
  }

  return `${amountLabel} / day`;
}
