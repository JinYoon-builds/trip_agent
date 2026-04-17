"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { trackEvent } from "../../../lib/analytics";
import { normalizeSiteLanguage } from "../../../lib/language";
import {
  MANUAL_PAYMENT_METHOD,
  MANUAL_PAYMENT_QR_IMAGE,
} from "../../../lib/manual-payment";
import {
  formatPaymentDisplayLabel,
  getGuideDayCountFromAnswers,
  getGuidePricingQuote,
} from "../../../lib/pricing";
import {
  readSurveySubmission,
  saveSurveySubmission,
} from "../../../lib/survey-local-storage";
import { fetchRemoteSubmission } from "../../../lib/submission-client";

const completionContent = {
  en: {
    brand: "刘Unnie",
    back: "Back to home",
    heroKicker: "Request Received",
    heroTitle: "Complete the final payment step",
    heroSubtitle:
      "Scan the WeChat Pay QR below, transfer the quoted amount, and we will review the payment before sending your guide details by email.",
    paidHeroTitle: "Payment completed",
    paidHeroSubtitle:
      "We confirmed your transfer. A local university student guide will contact you through the email you entered within 2 to 3 hours.",
    summaryKicker: "Trip Summary",
    summaryTitle: "Your Trip Details",
    summaryDescription:
      "Review the details below, then complete the manual payment.",
    summaryDescriptionPaid:
      "Review your submitted trip details and current payment status below.",
    summaryPillLocal: "Preview",
    summaryPillServer: "Awaiting Transfer",
    statusKicker: "Status",
    statusTitle: "Current Status",
    statusTextLocal:
      "This survey is temporarily stored only in the current browser. Until the backend flow is fully connected, you can use this state to review the experience.",
    statusTextServer:
      "This survey has been saved on the server and is now waiting for your manual payment transfer.",
    statusBadgeLocal: "Saved in Browser",
    statusBadgeServer: "Request Received",
    requestKicker: "Submission",
    requestTitle: "Saved Record",
    requestIdLabel: "Saved ID",
    submittedAtLabel: "Submitted At",
    paymentStatusPending: "Awaiting transfer",
    paymentStatusCreated: "Transfer submitted",
    paymentStatusProcessing: "Waiting for manual review",
    paymentStatusPaid: "Payment completed",
    paymentReadyLabel: "Manual payment",
    paymentBreakdown: (guideDayCount, discountPercent) =>
      discountPercent > 0
        ? `${guideDayCount} guide days selected · ${discountPercent}% discount applied`
        : `${guideDayCount} guide day selected · standard rate applied`,
    manualPaymentTitle: "Pay with WeChat Pay",
    manualPaymentDescription:
      "Open WeChat Pay, scan the QR, and transfer the quoted amount. For faster matching, use the same sender name as the name on this request.",
    manualPaymentSteps: [
      "Scan the QR code with WeChat Pay.",
      "Transfer the quoted amount shown on this page using the same sender name as the applicant name.",
    ],
    manualPaymentSenderNameLabel: "Sender name",
    manualPaymentSenderNameHelp:
      "Please use this same name as the sender name for the transfer.",
    manualPaymentReviewNote:
      "Once the transfer is confirmed, a local university student guide will contact you directly.",
    paymentSuccessTitle: "Payment completed!",
    paymentSuccessText:
      "We confirmed the transfer. A local university student guide will contact you through the email you entered within 2 to 3 hours.",
    nextTitle: "What Happens Next",
    nextSteps: [
      "We check the incoming transfer.",
      "Once the transfer is confirmed, a local university student guide will contact you directly.",
    ],
    noteTitle: "Before You Leave",
    noteTextLocal:
      "Right now the flow only saves the survey locally and moves to the completion page. If browser data is cleared, the saved response disappears too.",
    noteTextServer:
      "Once the transfer is confirmed, we will send your guide introduction to the email you entered. You do not need to submit anything else unless we contact you.",
    homeAction: "Back to home",
    restartAction: "Fill out the survey again",
    missingTitle: "We could not find the saved survey",
    missingText:
      "This response is not available in local browser storage, or it has already been removed. Please fill out the survey again.",
    missingAction: "Go to survey",
    loadErrorTitle: "Could not load the survey details",
    loadErrorText:
      "The saved server record could not be loaded, and no local browser copy was found either. Please finish the setup and try again.",
  },
  ko: {
    brand: "刘Unnie",
    back: "랜딩으로 돌아가기",
    heroKicker: "설문 접수 완료",
    heroTitle: "마지막 결제 단계만 남았습니다",
    heroSubtitle:
      "아래 위챗페이 QR을 스캔해 안내된 금액을 입금하면, 운영팀이 확인 후 입력한 이메일로 가이드 안내를 보내드립니다.",
    paidHeroTitle: "결제가 완료되었습니다",
    paidHeroSubtitle:
      "입금 확인이 완료되었습니다. 2~3시간 이내에 현지 대학생 가이드가 입력하신 이메일로 연락드릴 예정입니다.",
    summaryKicker: "여행 요약",
    summaryTitle: "입력한 여행 정보",
    summaryDescription:
      "아래 내용을 확인한 뒤 수동 결제를 진행해 주세요.",
    summaryDescriptionPaid:
      "입력한 여행 정보와 현재 결제 상태를 아래에서 확인해 주세요.",
    summaryPillLocal: "Preview",
    summaryPillServer: "입금 확인 대기",
    statusKicker: "Status",
    statusTitle: "현재 상태",
    statusTextLocal:
      "이 설문은 현재 브라우저에만 임시 저장되어 있습니다. 새 설문 흐름이나 백엔드 연결 전까지는 이 상태를 기준으로 UX를 점검할 수 있습니다.",
    statusTextServer:
      "이 설문은 서버에 정상 접수되었고, 현재 수동 입금 확인을 기다리는 상태입니다.",
    statusBadgeLocal: "브라우저 임시 저장",
    statusBadgeServer: "신청 접수 완료",
    requestKicker: "Submission",
    requestTitle: "접수 정보",
    requestIdLabel: "저장 ID",
    submittedAtLabel: "접수 시각",
    paymentStatusPending: "입금 확인 대기",
    paymentStatusCreated: "입금 접수됨",
    paymentStatusProcessing: "운영팀 확인 중",
    paymentStatusPaid: "결제 완료",
    paymentReadyLabel: "수동 결제",
    paymentBreakdown: (guideDayCount, discountPercent) =>
      discountPercent > 0
        ? `가이드 ${guideDayCount}일 선택 · ${discountPercent}% 할인 적용`
        : `가이드 ${guideDayCount}일 선택 · 기본 요금 적용`,
    manualPaymentTitle: "위챗페이로 결제하기",
    manualPaymentDescription:
      "위챗페이에서 QR을 스캔한 뒤, 이 페이지에 표시된 금액만큼 입금해 주세요. 빠른 확인을 위해 입금자명을 신청자명과 동일하게 맞춰 주세요.",
    manualPaymentSteps: [
      "위챗페이에서 아래 QR을 스캔해 주세요.",
      "이 페이지에 표시된 예상 금액을 신청자명과 동일한 입금자명으로 보내 주세요.",
    ],
    manualPaymentSenderNameLabel: "입금자명",
    manualPaymentSenderNameHelp:
      "송금 시 입금자명을 이 이름과 동일하게 맞춰 주세요.",
    manualPaymentReviewNote:
      "입금이 확인되면 현지 대학생 가이드가 직접 연락드립니다.",
    paymentSuccessTitle: "결제가 완료되었습니다!",
    paymentSuccessText:
      "입금 확인이 완료되었습니다. 2~3시간 이내에 현지 대학생 가이드가 입력하신 이메일로 연락드릴 예정입니다.",
    nextTitle: "다음 진행 방식",
    nextSteps: [
      "운영팀이 입금 내역을 확인합니다.",
      "입금이 확인되면 현지 대학생 가이드가 직접 연락드립니다.",
    ],
    noteTitle: "안내 사항",
    noteTextLocal:
      "설문 완료 후 로컬 저장과 완료 페이지 이동까지만 연결되어 있습니다. 브라우저 데이터를 지우면 저장 내용도 함께 사라집니다.",
    noteTextServer:
      "입금 확인이 끝나면 별도 요청 없이 입력한 이메일로 가이드 안내를 보내드립니다. 추가 확인이 필요한 경우에만 운영팀이 별도로 연락드립니다.",
    homeAction: "랜딩으로 돌아가기",
    restartAction: "설문 다시 작성하기",
    missingTitle: "저장된 설문을 찾지 못했습니다",
    missingText:
      "브라우저 로컬 저장소에 해당 응답이 없거나 이미 삭제된 상태입니다. 다시 설문을 작성해 주세요.",
    missingAction: "설문으로 이동",
    loadErrorTitle: "설문 정보를 불러오지 못했습니다",
    loadErrorText:
      "현재 서버 저장본을 조회할 수 없고, 브라우저 로컬 저장본도 찾지 못했습니다. 설정을 마친 뒤 다시 시도해 주세요.",
  },
  zh: {
    brand: "刘Unnie",
    back: "返回落地页",
    heroKicker: "问卷提交完成",
    heroTitle: "只剩最后一步付款",
    heroSubtitle:
      "请扫描下方微信支付二维码并完成转账。我们确认到账后，会把向导信息发送到你填写的邮箱。",
    paidHeroTitle: "支付已完成",
    paidHeroSubtitle:
      "我们已经确认到账。2 到 3 小时内，当地大学生向导会通过你填写的邮箱联系你。",
    summaryKicker: "行程摘要",
    summaryTitle: "你填写的旅行信息",
    summaryDescription: "请确认以下内容，然后完成手动付款。",
    summaryDescriptionPaid: "请在下方确认你填写的旅行信息和当前支付状态。",
    summaryPillLocal: "Preview",
    summaryPillServer: "等待到账确认",
    statusKicker: "Status",
    statusTitle: "当前状态",
    statusTextLocal:
      "这份问卷目前只临时保存在当前浏览器中。在接入后端之前，可以先用这个流程验证整体体验。",
    statusTextServer:
      "这份问卷已经保存到服务器，当前正在等待你完成手动转账。",
    statusBadgeLocal: "已暂存到浏览器",
    statusBadgeServer: "申请已接收",
    requestKicker: "Submission",
    requestTitle: "保存信息",
    requestIdLabel: "保存 ID",
    submittedAtLabel: "提交时间",
    paymentStatusPending: "等待到账确认",
    paymentStatusCreated: "已提交转账",
    paymentStatusProcessing: "人工确认中",
    paymentStatusPaid: "支付完成",
    paymentReadyLabel: "手动付款",
    paymentBreakdown: (guideDayCount, discountPercent) =>
      discountPercent > 0
        ? `已选择 ${guideDayCount} 天向导 · 已应用 ${discountPercent}% 折扣`
        : `已选择 ${guideDayCount} 天向导 · 按标准价格计算`,
    manualPaymentTitle: "使用微信支付付款",
    manualPaymentDescription:
      "请打开微信支付扫描二维码，并按本页显示的金额转账。为了更快核对，请让付款人姓名与申请人姓名一致。",
    manualPaymentSteps: [
      "使用微信支付扫描下方二维码。",
      "请按本页显示的金额转账，并尽量使用与申请人相同的付款人姓名。",
    ],
    manualPaymentSenderNameLabel: "付款人姓名",
    manualPaymentSenderNameHelp:
      "转账时请把付款人姓名设置为这个名字。",
    manualPaymentReviewNote:
      "到账确认后，当地大学生向导会直接联系你。",
    paymentSuccessTitle: "支付已完成！",
    paymentSuccessText:
      "我们已经确认到账。2 到 3 小时内，当地大学生向导会通过你填写的邮箱联系你。",
    nextTitle: "接下来会发生什么",
    nextSteps: [
      "我们会确认到账记录。",
      "到账确认后，当地大学生向导会直接联系你。",
    ],
    noteTitle: "提示",
    noteTextLocal:
      "目前只实现了完成问卷后本地保存并跳转到完成页。清除浏览器数据后，保存内容也会一起消失。",
    noteTextServer:
      "到账确认后，我们会把向导介绍邮件发送到你填写的邮箱。除非我们主动联系你，否则不需要再提交其他内容。",
    homeAction: "返回落地页",
    restartAction: "重新填写问卷",
    missingTitle: "未找到已保存的问卷",
    missingText:
      "当前浏览器中没有这份本地保存的数据，或者它已经被清除。请重新填写问卷。",
    missingAction: "前往问卷",
    loadErrorTitle: "无法加载问卷信息",
    loadErrorText:
      "当前既无法读取服务器中的保存结果，也没有找到浏览器本地保存的数据。请完成设置后再试一次。",
  },
};

function formatSubmissionTimestamp(timestamp, language) {
  if (!timestamp) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(
      language === "ko"
        ? "ko-KR"
        : language === "zh"
          ? "zh-CN"
          : "en-US",
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

function getPaymentStatusLabel(content, paymentStatus) {
  if (paymentStatus === "paid") {
    return content.paymentStatusPaid;
  }

  if (paymentStatus === "payment_created") {
    return content.paymentStatusCreated;
  }

  if (paymentStatus === "payment_pending") {
    return content.paymentStatusProcessing;
  }

  if (
    paymentStatus === "awaiting_manual_payment" ||
    paymentStatus === "pending_payment"
  ) {
    return content.paymentStatusPending;
  }

  return content.paymentStatusPending;
}

export default function SurveyCompleteClient({
  initialLanguage,
  submissionId,
}) {
  const language = normalizeSiteLanguage(initialLanguage);
  const [submission, setSubmission] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadMode, setLoadMode] = useState("idle");
  const completeViewKeyRef = useRef("");

  useEffect(() => {
    let isMounted = true;

    async function loadSubmission() {
      const localSubmission = readSurveySubmission(submissionId);

      if (!submissionId) {
        if (isMounted) {
          setSubmission(localSubmission);
          setLoadMode("missing");
          setHasLoaded(true);
        }

        return;
      }

      try {
        const remoteSubmission = await fetchRemoteSubmission(submissionId);

        if (!isMounted) {
          return;
        }

        const normalizedSubmission = {
          ...remoteSubmission,
          storageMode: "server",
        };

        setSubmission(normalizedSubmission);
        saveSurveySubmission(normalizedSubmission);
        setLoadMode("server");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (localSubmission) {
          setSubmission(localSubmission);
          setLoadMode(localSubmission.storageMode === "server" ? "server" : "local");
        } else if (error?.status === 404) {
          setSubmission(null);
          setLoadMode("missing");
        } else {
          setSubmission(null);
          setLoadMode("error");
        }
      } finally {
        if (isMounted) {
          setHasLoaded(true);
        }
      }
    }

    loadSubmission();

    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  const content = completionContent[language];
  const isServerSubmission = loadMode === "server";
  const paymentStatus = submission?.paymentStatus ?? "awaiting_manual_payment";
  const isPaid = paymentStatus === "paid";
  const guideDayCount = getGuideDayCountFromAnswers(submission?.answers);
  const pricingQuote = getGuidePricingQuote({ guideDayCount });
  const paymentDisplayLabel =
    submission?.paymentDisplayLabel ||
    formatPaymentDisplayLabel({
      amount: pricingQuote.totalAmount,
      currency: pricingQuote.currency,
      language,
    });
  const applicantName =
    typeof submission?.answers?.fullName === "string" &&
    submission.answers.fullName.trim() !== ""
      ? submission.answers.fullName.trim()
      : "";
  const paymentStatusLabel = getPaymentStatusLabel(content, paymentStatus);
  const submittedAtText = formatSubmissionTimestamp(
    submission?.submittedAt,
    language,
  );
  const storageStatusLabel = isServerSubmission
    ? content.statusBadgeServer
    : content.statusBadgeLocal;
  const paymentStageLabel = isPaid
    ? content.paymentStatusPaid
    : isServerSubmission
      ? content.summaryPillServer
      : content.summaryPillLocal;
  const noteText = isServerSubmission
    ? content.noteTextServer
    : content.noteTextLocal;
  const paymentDetailText =
    isServerSubmission && !isPaid && applicantName
      ? `${content.manualPaymentSenderNameLabel}: ${applicantName}`
      : paymentStatusLabel;

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const viewKey = `${loadMode}:${submission?.id ?? "none"}`;

    if (completeViewKeyRef.current === viewKey) {
      return;
    }

    completeViewKeyRef.current = viewKey;

    trackEvent("survey_complete_view", {
      language,
      storage_mode: loadMode,
      payment_status: submission?.paymentStatus ?? "missing",
      guide_day_count: submission ? Number(guideDayCount) : undefined,
      amount: submission ? Number(pricingQuote.totalAmount) : undefined,
      currency: submission ? pricingQuote.currency : undefined,
    });
  }, [
    guideDayCount,
    hasLoaded,
    language,
    loadMode,
    pricingQuote.currency,
    pricingQuote.totalAmount,
    submission,
  ]);

  return (
    <main className="survey-page">
      <div className="survey-backdrop survey-backdrop-left" />
      <div className="survey-backdrop survey-backdrop-right" />

      <header className="survey-topbar">
        <div className="survey-brand-block">
          <Link className="survey-back-link" href={`/?lang=${language}`}>
            {content.back}
          </Link>
          <div className="survey-brandmark">{content.brand}</div>
        </div>
      </header>

      <section className="survey-hero">
        <div className="survey-hero-copy">
          <span className="survey-kicker">{content.heroKicker}</span>
          <h1>{isPaid ? content.paidHeroTitle : content.heroTitle}</h1>
          <p>{isPaid ? content.paidHeroSubtitle : content.heroSubtitle}</p>
        </div>
      </section>

      {!hasLoaded ? (
        <section className="survey-shell survey-complete-shell">
          <div className="survey-main-card survey-empty-card">
            <span className="survey-card-kicker">{content.statusKicker}</span>
            <h2>{content.statusTitle}</h2>
            <p>{content.statusTextLocal}</p>
          </div>
        </section>
      ) : loadMode === "error" ? (
        <section className="survey-shell survey-complete-shell">
          <div className="survey-main-card survey-empty-card">
            <span className="survey-card-kicker">{content.statusKicker}</span>
            <h2>{content.loadErrorTitle}</h2>
            <p>{content.loadErrorText}</p>
            <div className="survey-complete-actions">
              <Link
                className="survey-primary-button"
                href={`/survey?lang=${language}`}
              >
                {content.restartAction}
              </Link>
            </div>
          </div>
        </section>
      ) : !submission ? (
        <section className="survey-shell survey-complete-shell">
          <div className="survey-main-card survey-empty-card">
            <span className="survey-card-kicker">{content.statusKicker}</span>
            <h2>{content.missingTitle}</h2>
            <p>{content.missingText}</p>
            <div className="survey-complete-actions">
              <Link
                className="survey-primary-button"
                href={`/survey?lang=${language}`}
              >
                {content.missingAction}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="survey-shell survey-complete-shell">
          <div className="survey-main-card">
            <div className="survey-main-header">
              <div>
                <span className="survey-card-kicker">{content.summaryKicker}</span>
                <h2>{content.summaryTitle}</h2>
              </div>
            </div>

            <p className="survey-main-description">
              {isPaid ? content.summaryDescriptionPaid : content.summaryDescription}
            </p>

            <div
              className={`survey-status-pill ${
                isServerSubmission ? "survey-status-pill-server" : ""
              }`}
            >
              {storageStatusLabel}
            </div>

            <div className="survey-complete-grid">
              {submission.summary.map((item) => (
                <div className="survey-complete-summary-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="survey-inline-payment">
              <div className="survey-inline-payment-copy">
                <span className="survey-card-kicker">{content.paymentReadyLabel}</span>
                <strong>{paymentDisplayLabel}</strong>
                <p className="survey-payment-text">
                  {content.paymentBreakdown(
                    guideDayCount,
                    pricingQuote.discountPercent,
                  )}
                </p>
              </div>
              <div className="survey-inline-payment-status">
                <div
                  className={`survey-inline-payment-badge ${
                    isPaid
                      ? "survey-inline-payment-badge-paid"
                      : isServerSubmission
                        ? "survey-inline-payment-badge-server"
                        : ""
                  }`}
                >
                  {paymentStageLabel}
                </div>
                <span>{paymentDetailText}</span>
                <small>
                  {content.submittedAtLabel}: {submittedAtText}
                </small>
              </div>
            </div>

            {isServerSubmission && !isPaid ? (
              <div className="survey-payment-shell survey-manual-payment-shell">
                <div className="survey-manual-payment-layout">
                  <div className="survey-manual-payment-copy">
                    <span className="survey-card-kicker">{content.paymentReadyLabel}</span>
                    <strong>{content.manualPaymentTitle}</strong>
                    <p className="survey-payment-text">
                      {content.manualPaymentDescription}
                    </p>
                    <div className="survey-manual-payment-steps">
                      {content.manualPaymentSteps.map((step, index) => (
                        <div className="survey-manual-payment-step" key={step}>
                          <span className="survey-manual-payment-step-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                    <p className="survey-payment-helper">
                      {content.manualPaymentSenderNameHelp}
                    </p>
                    <p className="survey-payment-message">
                      {content.manualPaymentReviewNote}
                    </p>
                  </div>
                  <div className="survey-manual-payment-qr-card">
                    <span className="survey-manual-payment-method">
                      {MANUAL_PAYMENT_METHOD}
                    </span>
                    <img
                      alt={`${MANUAL_PAYMENT_METHOD} QR`}
                      className="survey-manual-payment-qr"
                      src={MANUAL_PAYMENT_QR_IMAGE}
                    />
                    {applicantName ? (
                      <div className="survey-manual-payment-reference-card">
                        <span>{content.manualPaymentSenderNameLabel}</span>
                        <strong>{applicantName}</strong>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {isServerSubmission && isPaid ? (
              <div className="survey-paid-state" role="status" aria-live="polite">
                <div className="survey-paid-state-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M20 6 9 17l-5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="survey-paid-state-copy">
                  <strong>{content.paymentSuccessTitle}</strong>
                  <p>{content.paymentSuccessText}</p>
                </div>
              </div>
            ) : null}

            {isServerSubmission ? (
              <div className="survey-next-card survey-payment-shell">
                <span className="survey-card-kicker">{content.nextTitle}</span>
                <div className="survey-next-list">
                  {content.nextSteps.map((step, index) => (
                    <div className="survey-next-item" key={step}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{step}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="survey-note-block">
              <span className="survey-card-kicker">{content.noteTitle}</span>
              <p>{noteText}</p>
            </div>

            <div className="survey-complete-actions">
              <Link className="survey-primary-button" href={`/?lang=${language}`}>
                {content.homeAction}
              </Link>
              <Link
                className="survey-secondary-link"
                href={`/survey?lang=${language}`}
              >
                {content.restartAction}
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
