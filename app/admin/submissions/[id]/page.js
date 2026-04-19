import { BRAND_NAME_GLOBAL } from "../../../../lib/brand";
import AdminSubmissionDetailClient from "./page-client";

export const metadata = {
  title: `${BRAND_NAME_GLOBAL} Admin Submission`,
};

export default function AdminSubmissionDetailPage() {
  return <AdminSubmissionDetailClient />;
}
