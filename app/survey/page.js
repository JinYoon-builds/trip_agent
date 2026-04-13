import SurveyClient from "./survey-client";

export default async function SurveyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = resolvedSearchParams?.lang === "zh" ? "zh" : "ko";

  return <SurveyClient initialLanguage={initialLanguage} />;
}
