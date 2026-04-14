import HomeClient from "./home-client";
import { normalizeSiteLanguage } from "../lib/language";

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <HomeClient initialLanguage={initialLanguage} />;
}
