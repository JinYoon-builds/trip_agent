"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/auth-provider";
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

export default function AdminPageClient() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, openAuthModal, profile, status } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
            <span className="admin-kicker">Admin Console</span>
            <h1>Guide matching requests</h1>
            <p>{profile?.email || ""}</p>
          </div>
          <Link className="admin-home-link" href="/">
            Back to home
          </Link>
        </div>

        {!isAuthenticated ? (
          <div className="admin-empty-card">
            <h2>Login required</h2>
            <p>Use the shared login modal to continue to the admin console.</p>
          </div>
        ) : null}

        {isAuthenticated && !isAdmin ? (
          <div className="admin-empty-card">
            <h2>Admin access only</h2>
            <p>This account does not have administrator access.</p>
          </div>
        ) : null}

        {isAuthenticated && isAdmin ? (
          <>
            <div className="admin-summary-grid">
              <div className="admin-summary-card">
                <span>Total submissions</span>
                <strong>{summary.total}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Paid</span>
                <strong>{summary.paid}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Awaiting transfer</span>
                <strong>{summary.awaitingTransfer}</strong>
              </div>
            </div>

            <div className="admin-table-card">
              {isLoading ? <p>Loading submissions...</p> : null}
              {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}
              {!isLoading && !errorMessage ? (
                <div className="admin-table">
                  <div className="admin-table-head">
                    <span>Applicant</span>
                    <span>Email</span>
                    <span>Status</span>
                    <span>Submitted</span>
                  </div>
                  {submissions.map((submission) => (
                    <Link
                      className="admin-table-row interactive"
                      href={`/admin/submissions/${submission.id}`}
                      key={submission.id}
                    >
                      <div className="admin-table-cell">
                        <span className="admin-table-label">Applicant</span>
                        <strong>{getApplicantName(submission)}</strong>
                      </div>
                      <div className="admin-table-cell">
                        <span className="admin-table-label">Email</span>
                        <strong>{submission.contactEmail}</strong>
                      </div>
                      <div className="admin-table-cell">
                        <span className="admin-table-label">Status</span>
                        <strong>{getSubmissionStatusLabel(submission.submissionStatus, "ko")}</strong>
                      </div>
                      <div className="admin-table-cell">
                        <span className="admin-table-label">Submitted</span>
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
