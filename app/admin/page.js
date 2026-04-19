import { BRAND_NAME_GLOBAL } from "../../lib/brand";
import AdminPageClient from "./page-client";

export const metadata = {
  title: `${BRAND_NAME_GLOBAL} Admin`,
};

export default function AdminPage() {
  return <AdminPageClient />;
}
