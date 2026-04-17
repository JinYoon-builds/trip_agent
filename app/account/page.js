import { normalizeSiteLanguage } from "../../lib/language";
import AccountPageClient from "./page-client";

export const metadata = {
  title: "刘Unnie Account",
};

export default async function AccountPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <AccountPageClient initialLanguage={initialLanguage} />;
}
