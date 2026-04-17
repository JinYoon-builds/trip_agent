import { normalizeSiteLanguage } from "../../../../../lib/language";
import SurveyClient from "../../../../survey/survey-client";

export const metadata = {
  title: "刘Unnie Edit Submission",
};

export default async function EditSubmissionPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return (
    <SurveyClient
      initialLanguage={initialLanguage}
      mode="edit"
      submissionId={resolvedParams.id}
    />
  );
}
