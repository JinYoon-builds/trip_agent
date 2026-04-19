import { normalizeSiteLanguage } from "./language";

export const BRAND_NAME_ZH = "刘Unnie";
export const BRAND_NAME_GLOBAL = "Liu-Unnie";

export function getBrandName(language) {
  return normalizeSiteLanguage(language) === "zh"
    ? BRAND_NAME_ZH
    : BRAND_NAME_GLOBAL;
}

export function getSiteTitle(language, suffix = "") {
  const brandName = getBrandName(language);

  return suffix ? `${brandName} ${suffix}` : brandName;
}
