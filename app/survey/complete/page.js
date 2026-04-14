import SurveyCompleteClient from "./survey-complete-client";
import { normalizeSiteLanguage } from "../../../lib/language";

export default async function SurveyCompletePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);
  const submissionId =
    typeof resolvedSearchParams?.id === "string" ? resolvedSearchParams.id : "";

  return (
    <SurveyCompleteClient
      initialLanguage={initialLanguage}
      submissionId={submissionId}
    />
  );
}
