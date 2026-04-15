"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { normalizeSiteLanguage } from "../lib/language";
import { trackPageView } from "../lib/analytics";

function getPageType(pathname) {
  if (pathname === "/") {
    return "landing";
  }

  if (pathname === "/survey") {
    return "survey";
  }

  if (pathname === "/survey/complete") {
    return "survey_complete";
  }

  return "other";
}

export default function Ga4PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const langParam = searchParams?.get("lang") ?? "";
  const searchString = langParam ? `lang=${normalizeSiteLanguage(langParam)}` : "";

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const normalizedLanguage = normalizeSiteLanguage(langParam);
    const normalizedPath = searchString ? `${pathname}?${searchString}` : pathname;

    trackPageView({
      pagePath: normalizedPath,
      pageLocation: `${window.location.origin}${normalizedPath}`,
      language: normalizedLanguage,
      page_type: getPageType(pathname),
    });
  }, [langParam, pathname, searchString]);

  return null;
}
