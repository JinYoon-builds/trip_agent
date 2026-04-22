"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../../components/auth-provider";
import { getSiteTitle } from "../../../../lib/brand";
import { normalizeSiteLanguage } from "../../../../lib/language";
import {
  fetchAdminSubmission,
  updateAdminSubmissionStatus,
} from "../../../../lib/submission-client";
import {
  getAllowedAdminSubmissionStatuses,
  ADMIN_MUTABLE_SUBMISSION_STATUSES,
} from "../../../../lib/submission-utils";
import { getSubmissionStatusLabel } from "../../../../lib/submission-status";

const detailCopy = {
  en: {
    kicker: "Admin Detail",
    title: "Submission detail",
    subtitle: "Review one request and update its workflow status.",
    loading: "Loading submission...",
    loginTitle: "Admin login required",
    loginText: "Please log in with an administrator account to continue.",
    forbiddenTitle: "Admin access only",
    forbiddenText: "This account does not have administrator access.",
    updateLabel: "Change status",
    updating: "Saving status...",
    saved: "Status updated successfully.",
    applicantTitle: "Applicant",
    requestTitle: "Request summary",
    rawAnswersTitle: "Raw answers",
    rawAnswersHint: "Open the raw payload",
    backAction: "Back to admin list",
    errorFallback: "Failed to load submission.",
    rowLabels: {
      applicant: "Applicant",
      email: "Email",
      status: "Status",
      quote: "Quote",
      submittedAt: "Submitted",
      updatedAt: "Updated",
      id: "ID",
    },
  },
  ko: {
    kicker: "관리 상세",
    title: "제출 상세",
    subtitle: "개별 요청 내용을 확인하고 상태를 변경할 수 있습니다.",
    loading: "제출 상세를 불러오는 중입니다...",
    loginTitle: "관리자 로그인이 필요합니다",
    loginText: "관리자 계정으로 로그인해 계속 진행해 주세요.",
    forbiddenTitle: "관리자 전용 페이지입니다",
    forbiddenText: "이 계정에는 관리자 권한이 없습니다.",
    updateLabel: "상태 변경",
    updating: "상태를 저장하는 중입니다...",
    saved: "상태가 저장되었습니다.",
    applicantTitle: "신청자 정보",
    requestTitle: "제출 요약",
    rawAnswersTitle: "원본 답변",
    rawAnswersHint: "원본 payload 펼치기",
    backAction: "관리 목록으로 돌아가기",
    errorFallback: "제출 상세를 불러오지 못했습니다.",
    rowLabels: {
      applicant: "신청자명",
      email: "이메일",
      status: "상태",
      quote: "예상 금액",
      submittedAt: "접수 시각",
      updatedAt: "수정 시각",
      id: "ID",
    },
  },
  zh: {
    kicker: "管理详情",
    title: "提交详情",
    subtitle: "查看单个请求并更新它的流程状态。",
    loading: "正在加载提交详情...",
    loginTitle: "需要管理员登录",
    loginText: "请使用管理员账号登录后继续。",
    forbiddenTitle: "仅限管理员访问",
    forbiddenText: "当前账号没有管理员权限。",
    updateLabel: "修改状态",
    updating: "正在保存状态...",
    saved: "状态已更新。",
    applicantTitle: "申请人信息",
    requestTitle: "提交摘要",
    rawAnswersTitle: "原始答案",
    rawAnswersHint: "展开原始 payload",
    backAction: "返回管理列表",
    errorFallback: "无法加载提交详情。",
    rowLabels: {
      applicant: "申请人",
      email: "邮箱",
      status: "状态",
      quote: "报价",
      submittedAt: "提交时间",
      updatedAt: "更新时间",
      id: "ID",
    },
  },
};

function formatPrettyJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function AdminSubmissionDetailClient({ initialLanguage = "en" }) {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isAuthenticated, openAuthModal, status } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const language = normalizeSiteLanguage(initialLanguage);
  const copy = detailCopy[language];
  const submissionId = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    document.title = getSiteTitle(language, "Admin Submission");
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
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextSubmission = await fetchAdminSubmission(submissionId);

        if (!cancelled) {
          setSubmission(nextSubmission);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error?.message || copy.errorFallback);
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
  }, [copy.errorFallback, isAdmin, isAuthenticated, openAuthModal, status, submissionId]);

  const applicantRows = useMemo(
    () => [
      [copy.rowLabels.applicant, submission?.applicantName || "-"],
      [copy.rowLabels.email, submission?.contactEmail || "-"],
      [copy.rowLabels.status, getSubmissionStatusLabel(submission?.submissionStatus, language)],
      [copy.rowLabels.quote, submission?.quotedDisplayLabel || "-"],
      [copy.rowLabels.submittedAt, submission?.submittedAt || "-"],
      [copy.rowLabels.updatedAt, submission?.updatedAt || "-"],
      [copy.rowLabels.id, submission?.id || "-"],
    ],
    [copy.rowLabels, language, submission],
  );
  const summaryRows = useMemo(
    () => (Array.isArray(submission?.summary) ? submission.summary : []),
    [submission?.summary],
  );
  const nextStatuses = useMemo(() => {
    if (!submission?.submissionStatus) {
      return [];
    }

    return getAllowedAdminSubmissionStatuses(submission.submissionStatus);
  }, [submission?.submissionStatus]);

  const handleStatusUpdate = async (nextStatus) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedSubmission = await updateAdminSubmissionStatus(submissionId, nextStatus);
      setSubmission(updatedSubmission);
      setSuccessMessage(copy.saved);
      router.refresh();
    } catch (error) {
      setErrorMessage(error?.message || copy.errorFallback);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-header">
          <div>
            <span className="admin-kicker">{copy.kicker}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <Link className="admin-home-link" href={`/admin?lang=${language}`}>
            {copy.backAction}
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
          <div className="admin-detail-layout">
            <div className="admin-table-card">
              {isLoading ? <p>{copy.loading}</p> : null}
              {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}
              {successMessage ? <p className="admin-success">{successMessage}</p> : null}

              {!isLoading && submission ? (
                <div className="admin-detail-card">
                  <h2>{copy.applicantTitle}</h2>
                  <div className="admin-detail-grid">
                    {applicantRows.map(([label, value]) => (
                      <div className="admin-detail-row" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="admin-status-actions">
                    <span>{copy.updateLabel}</span>
                    <div className="admin-status-button-row">
                      {ADMIN_MUTABLE_SUBMISSION_STATUSES.filter(
                        (statusValue) =>
                          statusValue === submission.submissionStatus ||
                          nextStatuses.includes(statusValue),
                      ).map((statusValue) => (
                        <button
                          className={
                            submission.submissionStatus === statusValue
                              ? "admin-status-button active"
                              : "admin-status-button"
                          }
                          disabled={isSaving || submission.submissionStatus === statusValue}
                          key={statusValue}
                          onClick={() => void handleStatusUpdate(statusValue)}
                          type="button"
                        >
                          {isSaving && submission.submissionStatus === statusValue
                            ? copy.updating
                            : getSubmissionStatusLabel(statusValue, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {!isLoading && submission ? (
              <div className="admin-table-card">
                <h2>{copy.requestTitle}</h2>
                <div className="admin-summary-grid compact">
                  {summaryRows.map((item) => (
                    <div className="admin-summary-card detail" key={`${item.label}-${item.value}`}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <details className="admin-raw-details">
                  <summary>{copy.rawAnswersHint}</summary>
                  <div className="admin-raw-details-body">
                    <h3>{copy.rawAnswersTitle}</h3>
                    <pre className="admin-json-view">{formatPrettyJson(submission.answers)}</pre>
                  </div>
                </details>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
