export function normalizeSiteLanguage(language) {
  return language === "zh" || language === "ko" ? language : "en";
}
