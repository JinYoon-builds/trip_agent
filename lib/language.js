export function normalizeSiteLanguage(language) {
  return language === "en" || language === "ko" ? language : "zh";
}

export function getPayPalLocale(language) {
  const normalizedLanguage = normalizeSiteLanguage(language);

  if (normalizedLanguage === "en") {
    return "en_US";
  }

  if (normalizedLanguage === "zh") {
    return "zh_CN";
  }

  return "ko_KR";
}
