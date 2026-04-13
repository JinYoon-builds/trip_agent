import SurveyCompleteClient from "./survey-complete-client";

export default async function SurveyCompletePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = resolvedSearchParams?.lang === "zh" ? "zh" : "ko";
  const submissionId =
    typeof resolvedSearchParams?.id === "string" ? resolvedSearchParams.id : "";

  return (
    <SurveyCompleteClient
      initialLanguage={initialLanguage}
      submissionId={submissionId}
    />
  );
}
