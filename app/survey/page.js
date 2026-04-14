import SurveyClient from "./survey-client";
import { normalizeSiteLanguage } from "../../lib/language";

export default async function SurveyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <SurveyClient initialLanguage={initialLanguage} />;
}
