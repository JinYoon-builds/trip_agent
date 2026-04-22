import { BRAND_NAME_GLOBAL } from "../../lib/brand";
import { normalizeSiteLanguage } from "../../lib/language";
import AdminPageClient from "./page-client";

export const metadata = {
  title: `${BRAND_NAME_GLOBAL} Admin`,
};

export default async function AdminPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <AdminPageClient initialLanguage={initialLanguage} />;
}
