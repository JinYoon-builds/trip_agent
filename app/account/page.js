import { getSiteTitle } from "../../lib/brand";
import { normalizeSiteLanguage } from "../../lib/language";
import AccountPageClient from "./page-client";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return {
    title: getSiteTitle(initialLanguage, "Account"),
  };
}

export default async function AccountPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <AccountPageClient initialLanguage={initialLanguage} />;
}
