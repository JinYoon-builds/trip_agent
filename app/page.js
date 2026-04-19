import HomeClient from "./home-client";
import { getSiteTitle } from "../lib/brand";
import { normalizeSiteLanguage } from "../lib/language";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return {
    title: getSiteTitle(initialLanguage),
  };
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialLanguage = normalizeSiteLanguage(resolvedSearchParams?.lang);

  return <HomeClient initialLanguage={initialLanguage} />;
}
