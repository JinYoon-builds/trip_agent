"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/auth-provider";
import { normalizeSiteLanguage } from "../../lib/language";
import { listSurveySubmissions } from "../../lib/survey-local-storage";
import { fetchRemoteSubmissions } from "../../lib/submission-client";
import { getSubmissionStatusLabel } from "../../lib/submission-status";

function isEditableFallback(submission) {
  return (
    submission?.submissionStatus === "awaiting_transfer" ||
    submission?.submissionStatus === "payment_review"
  );
}

function normalizeStoredSubmission(submission) {
  return {
    ...submission,
    isEditable:
      typeof submission?.isEditable === "boolean"
        ? submission.isEditable
        : isEditableFallback(submission),
  };
}

const accountCopy = {
  en: {
    kicker: "My Page",
    title: "My submissions",
    subtitle: "Review your submitted surveys and payment progress here.",
    emptyTitle: "No submissions yet",
    emptyText: "Once you submit the survey, your saved requests will appear here.",
    loading: "Loading submissions...",
    loginTitle: "Login required",
    loginText: "Please log in to review your saved submissions.",
    errorFallback: "Failed to load submissions.",
    quoteLabel: "Quote",
    submittedAtLabel: "Submitted",
    statusLabel: "Status",
    summaryLabel: "Submitted details",
    editAction: "Edit survey",
    paidLocked: "Locked after payment",
    startAction: "Go to survey",
    backHome: "Back to home",
  },
  ko: {
    kicker: "마이페이지",
    title: "내 제출 목록",
    subtitle: "제출한 설문과 현재 결제 진행 상태를 여기에서 확인할 수 있습니다.",
    emptyTitle: "아직 제출한 설문이 없습니다",
    emptyText: "설문을 제출하면 저장된 요청이 이 페이지에 표시됩니다.",
    loading: "제출 목록을 불러오는 중입니다...",
    loginTitle: "로그인이 필요합니다",
    loginText: "저장된 제출 목록을 보려면 로그인해 주세요.",
    errorFallback: "제출 목록을 불러오지 못했습니다.",
    quoteLabel: "예상 금액",
    submittedAtLabel: "제출 시각",
    statusLabel: "상태",
    summaryLabel: "제출 내용",
    editAction: "설문 수정",
    paidLocked: "결제 완료 후 수정 불가",
    startAction: "설문 작성하러 가기",
    backHome: "홈으로 돌아가기",
  },
  zh: {
    kicker: "我的页面",
    title: "我的提交记录",
    subtitle: "你可以在这里查看已提交的问卷和当前付款状态。",
    emptyTitle: "还没有提交记录",
    emptyText: "提交问卷后，你保存的请求会显示在这里。",
    loading: "正在加载提交记录...",
    loginTitle: "需要先登录",
    loginText: "请先登录后再查看你保存的提交记录。",
    errorFallback: "无法加载提交记录。",
    quoteLabel: "报价",
    submittedAtLabel: "提交时间",
    statusLabel: "状态",
    summaryLabel: "提交内容",
    editAction: "编辑问卷",
    paidLocked: "支付完成后不可修改",
    startAction: "去填写问卷",
    backHome: "返回首页",
  },
};

function formatTimestamp(timestamp, language) {
  if (!timestamp) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(
      language === "ko"
        ? "ko-KR"
        : language === "en"
          ? "en-US"
          : "zh-CN",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    ).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

export default function AccountPageClient({ initialLanguage }) {
  const router = useRouter();
  const { isAuthenticated, openAuthModal, status } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const language = normalizeSiteLanguage(initialLanguage);
  const copy = accountCopy[language];

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    if (!isAuthenticated) {
      openAuthModal("signIn", "general");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      const localSubmissions = listSurveySubmissions();

      try {
        const remoteSubmissions = await fetchRemoteSubmissions();
        const mergedSubmissions = new Map();

        localSubmissions.forEach((submission) => {
          if (submission?.id) {
            mergedSubmissions.set(submission.id, normalizeStoredSubmission(submission));
          }
        });
        remoteSubmissions.forEach((submission) => {
          if (submission?.id) {
            mergedSubmissions.set(submission.id, submission);
          }
        });

        if (!cancelled) {
          setSubmissions(Array.from(mergedSubmissions.values()));
        }
      } catch (error) {
        if (!cancelled) {
          setSubmissions(localSubmissions.map(normalizeStoredSubmission));
          setErrorMessage(
            localSubmissions.length > 0 ? "" : error?.message || copy.errorFallback,
          );
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
  }, [copy.errorFallback, isAuthenticated, openAuthModal, status]);

  const sortedSubmissions = useMemo(
    () =>
      [...submissions].sort((left, right) =>
        String(right.submittedAt || "").localeCompare(String(left.submittedAt || "")),
      ),
    [submissions],
  );

  return (
    <main className="account-page">
      <section className="account-shell">
        <div className="account-header">
          <div>
            <span className="account-kicker">{copy.kicker}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <button
            className="account-home-link"
            onClick={() => router.push(`/?lang=${language}`)}
            type="button"
          >
            {copy.backHome}
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="account-empty-card">
            <h2>{copy.loginTitle}</h2>
            <p>{copy.loginText}</p>
          </div>
        ) : null}

        {isAuthenticated ? (
          <div className="account-list-card">
            {isLoading ? <p>{copy.loading}</p> : null}
            {errorMessage ? <p className="account-error">{errorMessage}</p> : null}
            {!isLoading && !errorMessage && sortedSubmissions.length === 0 ? (
              <div className="account-empty-card">
                <h2>{copy.emptyTitle}</h2>
                <p>{copy.emptyText}</p>
                <Link className="account-primary-link" href={`/survey?lang=${language}`}>
                  {copy.startAction}
                </Link>
              </div>
            ) : null}
            {!isLoading && !errorMessage && sortedSubmissions.length > 0 ? (
              <div className="account-submission-list">
                {sortedSubmissions.map((submission) => (
                  <article className="account-submission-card" key={submission.id}>
                    <div className="account-submission-top">
                      <div>
                        <span className="account-status-label">{copy.statusLabel}</span>
                        <strong>
                          {getSubmissionStatusLabel(submission.submissionStatus, language)}
                        </strong>
                      </div>
                      <span
                        className={
                          submission.isEditable
                            ? "account-status-pill editable"
                            : "account-status-pill locked"
                        }
                      >
                        {submission.isEditable ? copy.editAction : copy.paidLocked}
                      </span>
                    </div>

                    <div className="account-submission-grid">
                      <div>
                        <span>{copy.quoteLabel}</span>
                        <strong>{submission.quotedDisplayLabel}</strong>
                      </div>
                      <div>
                        <span>{copy.submittedAtLabel}</span>
                        <strong>{formatTimestamp(submission.submittedAt, language)}</strong>
                      </div>
                    </div>

                    {Array.isArray(submission.summary) && submission.summary.length > 0 ? (
                      <div className="account-summary-block">
                        <span className="account-summary-title">{copy.summaryLabel}</span>
                        <div className="account-summary-list">
                          {submission.summary.map((item) => (
                            <div className="account-summary-row" key={`${submission.id}-${item.label}`}>
                              <span>{item.label}</span>
                              <strong>{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {submission.isEditable ? (
                      <Link
                        className="account-primary-link"
                        href={`/account/submissions/${submission.id}/edit?lang=${submission.language || language}`}
                      >
                        {copy.editAction}
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
