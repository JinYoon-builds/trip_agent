import SurveyClient from "./survey-client";
import { getSiteTitle } from "../../lib/brand";
import { normalizeSiteLanguage } from "../../lib/language";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return {
    title: getSiteTitle(initialLanguage),
  };
}

export default async function SurveyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <SurveyClient initialLanguage={initialLanguage} />;
}
