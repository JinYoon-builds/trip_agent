"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/auth-provider";
import { getSiteTitle } from "../../lib/brand";
import { normalizeSiteLanguage } from "../../lib/language";
import { getSubmissionStatusLabel } from "../../lib/submission-status";
import { getCurrentAccessToken } from "../../lib/supabase-browser";

async function fetchAdminSubmissions() {
  const token = await getCurrentAccessToken();
  const response = await fetch("/api/admin/submissions", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || "Failed to fetch submissions.");
    error.status = response.status;
    throw error;
  }

  return data?.submissions ?? [];
}

function formatAdminSubmittedAt(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}시`;
}

function getApplicantName(submission) {
  const directName =
    typeof submission?.applicantName === "string" ? submission.applicantName.trim() : "";

  if (directName) {
    return directName;
  }

  const answerName =
    typeof submission?.answers?.fullName === "string"
      ? submission.answers.fullName.trim()
      : "";

  if (answerName) {
    return answerName;
  }

  const summaryName =
    Array.isArray(submission?.summary) && typeof submission.summary[0]?.value === "string"
      ? submission.summary[0].value.trim()
      : "";

  return summaryName || "-";
}

const adminCopy = {
  en: {
    kicker: "Admin Console",
    title: "Guide matching requests",
    backHome: "Back to home",
    loginTitle: "Login required",
    loginText: "Use the shared login modal to continue to the admin console.",
    forbiddenTitle: "Admin access only",
    forbiddenText: "This account does not have administrator access.",
    totalLabel: "Total submissions",
    paidLabel: "Paid",
    awaitingLabel: "Awaiting payment",
    loading: "Loading submissions...",
    applicantLabel: "Applicant",
    emailLabel: "Email",
    statusLabel: "Status",
    submittedLabel: "Submitted",
  },
  ko: {
    kicker: "Admin Console",
    title: "Guide matching requests",
    backHome: "Back to home",
    loginTitle: "Login required",
    loginText: "Use the shared login modal to continue to the admin console.",
    forbiddenTitle: "Admin access only",
    forbiddenText: "This account does not have administrator access.",
    totalLabel: "Total submissions",
    paidLabel: "Paid",
    awaitingLabel: "Awaiting payment",
    loading: "Loading submissions...",
    applicantLabel: "Applicant",
    emailLabel: "Email",
    statusLabel: "Status",
    submittedLabel: "Submitted",
  },
  zh: {
    kicker: "Admin Console",
    title: "Guide matching requests",
    backHome: "Back to home",
    loginTitle: "Login required",
    loginText: "Use the shared login modal to continue to the admin console.",
    forbiddenTitle: "Admin access only",
    forbiddenText: "This account does not have administrator access.",
    totalLabel: "Total submissions",
    paidLabel: "Paid",
    awaitingLabel: "Awaiting payment",
    loading: "Loading submissions...",
    applicantLabel: "Applicant",
    emailLabel: "Email",
    statusLabel: "Status",
    submittedLabel: "Submitted",
  },
};

export default function AdminPageClient({ initialLanguage = "en" }) {
  const router = useRouter();
  const { isAdmin, isAuthenticated, openAuthModal, profile, status } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const language = normalizeSiteLanguage(initialLanguage);
  const copy = adminCopy[language];

  useEffect(() => {
    document.title = getSiteTitle(language, "Admin");
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    if (!isAuthenticated) {
      openAuthModal("signIn", "admin");
      setIsLoading(false);
      return;
    }

    if (!isAdmin) {
      setIsLoading(false);
      router.replace("/");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextSubmissions = await fetchAdminSubmissions();

        if (!cancelled) {
          setSubmissions(nextSubmissions);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setErrorMessage(error?.message || "Failed to load submissions.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isAuthenticated, openAuthModal, router, status]);

  const summary = useMemo(() => {
    const total = submissions.length;
    const paid = submissions.filter((item) => item.submissionStatus === "paid").length;
    const awaitingTransfer = submissions.filter(
      (item) => item.submissionStatus === "awaiting_transfer",
    ).length;

    return { total, paid, awaitingTransfer };
  }, [submissions]);

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-header">
          <div>
            <span className="admin-kicker">{copy.kicker}</span>
            <h1>{copy.title}</h1>
            <p>{profile?.email || ""}</p>
          </div>
          <Link className="admin-home-link" href={`/?lang=${language}`}>
            {copy.backHome}
          </Link>
        </div>

        {!isAuthenticated ? (
          <div className="admin-empty-card">
            <h2>{copy.loginTitle}</h2>
            <p>{copy.loginText}</p>
          </div>
        ) : null}

        {isAuthenticated && !isAdmin ? (
          <div className="admin-empty-card">
            <h2>{copy.forbiddenTitle}</h2>
            <p>{copy.forbiddenText}</p>
          </div>
        ) : null}

        {isAuthenticated && isAdmin ? (
          <>
            <div className="admin-summary-grid">
              <div className="admin-summary-card">
                <span>{copy.totalLabel}</span>
                <strong>{summary.total}</strong>
              </div>
              <div className="admin-summary-card">
                <span>{copy.paidLabel}</span>
                <strong>{summary.paid}</strong>
              </div>
              <div className="admin-summary-card">
                <span>{copy.awaitingLabel}</span>
                <strong>{summary.awaitingTransfer}</strong>
              </div>
            </div>

            <div className="admin-table-card">
              {isLoading ? <p>{copy.loading}</p> : null}
              {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}
              {!isLoading && !errorMessage ? (
                <div className="admin-table">
                  <div className="admin-table-head">
                    <span>{copy.applicantLabel}</span>
                    <span>{copy.emailLabel}</span>
                    <span>{copy.statusLabel}</span>
                    <span>{copy.submittedLabel}</span>
                  </div>
                  {submissions.map((submission) => (
                    <Link
                      className="admin-table-row interactive"
                      href={`/admin/submissions/${submission.id}?lang=${language}`}
                      key={submission.id}
                    >
                      <div className="admin-table-cell">
                        <span className="admin-table-label">{copy.applicantLabel}</span>
                        <strong>{getApplicantName(submission)}</strong>
                      </div>
                      <div className="admin-table-cell">
                        <span className="admin-table-label">{copy.emailLabel}</span>
                        <strong>{submission.contactEmail}</strong>
                      </div>
                      <div className="admin-table-cell">
                        <span className="admin-table-label">{copy.statusLabel}</span>
                        <strong>{getSubmissionStatusLabel(submission.submissionStatus, language)}</strong>
                      </div>
                      <div className="admin-table-cell">
                        <span className="admin-table-label">{copy.submittedLabel}</span>
                        <strong>{formatAdminSubmittedAt(submission.submittedAt)}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
