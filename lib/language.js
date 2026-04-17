export function normalizeSiteLanguage(language) {
  return language === "en" || language === "ko" ? language : "zh";
}
