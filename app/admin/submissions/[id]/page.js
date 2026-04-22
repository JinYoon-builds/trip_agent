import { BRAND_NAME_GLOBAL } from "../../../../lib/brand";
import { normalizeSiteLanguage } from "../../../../lib/language";
import AdminSubmissionDetailClient from "./page-client";

export const metadata = {
  title: `${BRAND_NAME_GLOBAL} Admin Submission`,
};

export default async function AdminSubmissionDetailPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <AdminSubmissionDetailClient initialLanguage={initialLanguage} />;
}
