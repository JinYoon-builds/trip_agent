"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  readSurveySubmission,
  saveSurveySubmission,
} from "../../../lib/survey-local-storage";
import {
  captureRemotePayPalOrder,
  createRemotePayPalOrder,
  fetchRemoteSubmission,
} from "../../../lib/submission-client";

const DEFAULT_PAYMENT_DISPLAY_LABEL = "₩200,000";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const PAYPAL_CURRENCY = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD";

function getPayPalLocale(language) {
  return language === "zh" ? "zh_CN" : "ko_KR";
}

function loadPayPalSdk({ clientId, currency, locale }) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal SDK can only load in the browser."));
  }

  if (window.paypal?.Buttons) {
    return Promise.resolve(window.paypal);
  }

  const existingScript = document.querySelector("script[data-paypal-sdk='true']");

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.paypal), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load PayPal SDK.")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      components: "buttons",
      currency,
      intent: "capture",
      locale,
      "disable-funding": "card,credit,paylater,venmo",
    });

    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.addEventListener("load", () => resolve(window.paypal), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load PayPal SDK.")),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

const completionContent = {
  ko: {
    brand: "tripagent",
    back: "랜딩으로 돌아가기",
    heroKicker: "Survey Complete",
    heroTitle: "거의 완료되었습니다",
    heroSubtitle:
      "PayPal 결제를 완료하면 입력한 이메일로 몇 시간 내 맞춤 가이드 안내를 보내드립니다.",
    summaryKicker: "Travel Snapshot",
    summaryTitle: "입력한 여행 정보",
    summaryDescription:
      "아래 내용을 확인한 뒤 결제를 마무리해 주세요.",
    summaryPillLocal: "Preview",
    summaryPillServer: "Ready to Pay",
    statusKicker: "Status",
    statusTitle: "현재 상태",
    statusTextLocal:
      "이 설문은 현재 브라우저에만 임시 저장되어 있습니다. 새 설문 흐름이나 백엔드 연결 전까지는 이 상태를 기준으로 UX를 점검할 수 있습니다.",
    statusTextServer:
      "이 설문은 서버에 접수되어 결제와 운영 확인 흐름을 이어붙일 준비가 된 상태입니다.",
    statusBadgeLocal: "로컬 저장 완료",
    statusBadgeServer: "서버 저장 완료",
    requestKicker: "Submission",
    requestTitle: "접수 정보",
    requestIdLabel: "저장 ID",
    submittedAtLabel: "저장 시각",
    paymentStatusPending: "결제 대기",
    paymentStatusCreated: "주문 생성됨",
    paymentStatusProcessing: "승인 처리 중",
    paymentStatusPaid: "결제 완료",
    paymentReadyLabel: "PayPal 결제",
    paymentSdkMissing:
      "PayPal sandbox client id가 아직 없어 결제 버튼을 렌더할 수 없습니다.",
    paymentLoadingSdk: "PayPal 버튼을 불러오는 중입니다...",
    paymentButtonHint:
      "결제를 완료하면 입력한 이메일로 몇 시간 내 가이드 안내 메일을 보내드립니다.",
    paymentError:
      "PayPal 결제를 진행하지 못했습니다. 설정값과 sandbox 앱 상태를 확인해 주세요.",
    paymentCancelled:
      "결제가 취소되었습니다. 다시 시도하면 새 주문을 생성합니다.",
    paymentCompleted:
      "결제가 완료되었습니다. 입력한 이메일로 몇 시간 내 가이드 안내 메일을 보내드릴 예정입니다.",
    paymentUnavailable:
      "현재 환경에서는 PayPal 버튼을 표시할 수 없습니다.",
    nextTitle: "다음에 붙이면 좋은 흐름",
    nextSteps: [
      "결제 완료된 고객을 운영자가 확인하기",
      "몇 시간 안에 가이드 안내 메일을 직접 보내기",
      "마지막에 PayPal webhook과 자동 메일 발송 붙이기",
    ],
    noteTitle: "현재 구현 범위",
    noteTextLocal:
      "설문 완료 후 로컬 저장과 완료 페이지 이동까지만 연결되어 있습니다. 브라우저 데이터를 지우면 저장 내용도 함께 사라집니다.",
    noteTextServer:
      "서버 저장 API와 PayPal/Resend 연동 라우트는 준비되어 있습니다. 계정 키만 넣으면 실제 결제 플로우를 연결할 수 있습니다.",
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
    brand: "tripagent",
    back: "返回落地页",
    heroKicker: "Survey Complete",
    heroTitle: "快完成了",
    heroSubtitle:
      "完成 PayPal 支付后，我们会在几小时内把定制向导邮件发送到你填写的邮箱。",
    summaryKicker: "Travel Snapshot",
    summaryTitle: "你填写的旅行信息",
    summaryDescription: "请确认以下内容，然后完成支付。",
    summaryPillLocal: "Preview",
    summaryPillServer: "Ready to Pay",
    statusKicker: "Status",
    statusTitle: "当前状态",
    statusTextLocal:
      "这份问卷目前只临时保存在当前浏览器中。在接入后端之前，可以先用这个流程验证整体体验。",
    statusTextServer:
      "这份问卷已经保存到服务器，后续可以继续接入支付与运营确认流程。",
    statusBadgeLocal: "已本地保存",
    statusBadgeServer: "已保存到服务器",
    requestKicker: "Submission",
    requestTitle: "保存信息",
    requestIdLabel: "保存 ID",
    submittedAtLabel: "保存时间",
    paymentStatusPending: "等待支付",
    paymentStatusCreated: "订单已创建",
    paymentStatusProcessing: "支付处理中",
    paymentStatusPaid: "支付完成",
    paymentReadyLabel: "PayPal 支付",
    paymentSdkMissing:
      "还没有提供 PayPal sandbox client id，因此暂时无法渲染支付按钮。",
    paymentLoadingSdk: "正在加载 PayPal 按钮...",
    paymentButtonHint:
      "完成支付后，我们会在几小时内把向导介绍邮件发送到你填写的邮箱。",
    paymentError:
      "暂时无法完成 PayPal 支付。请检查配置和 sandbox app 状态。",
    paymentCancelled:
      "支付已取消。再次尝试时会创建新的订单。",
    paymentCompleted:
      "支付已经完成。我们会在几小时内把向导介绍邮件发送到你填写的邮箱。",
    paymentUnavailable:
      "当前环境无法显示 PayPal 按钮。",
    nextTitle: "后续可以接上的流程",
    nextSteps: [
      "由运营确认已付款客户",
      "在几小时内手动发送向导介绍邮件",
      "最后再加 PayPal webhook 和自动发信",
    ],
    noteTitle: "当前实现范围",
    noteTextLocal:
      "目前只实现了完成问卷后本地保存并跳转到完成页。清除浏览器数据后，保存内容也会一起消失。",
    noteTextServer:
      "服务器保存 API 与 PayPal/Resend 路由已经准备好。填入账号密钥后，就可以继续接入真实支付流程。",
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

export default function SurveyCompleteClient({
  initialLanguage,
  submissionId,
}) {
  const [submission, setSubmission] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadMode, setLoadMode] = useState("idle");
  const [isPayPalReady, setIsPayPalReady] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const paypalContainerRef = useRef(null);
  const paypalButtonsRef = useRef(null);

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
          paymentDisplayLabel:
            remoteSubmission?.paymentDisplayLabel || DEFAULT_PAYMENT_DISPLAY_LABEL,
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

  const content = completionContent[initialLanguage];
  const isServerSubmission = loadMode === "server";
  const paymentStatus = submission?.paymentStatus ?? "pending_payment";
  const canRenderPayPal =
    isServerSubmission && Boolean(PAYPAL_CLIENT_ID) && paymentStatus !== "paid";

  useEffect(() => {
    if (!canRenderPayPal) {
      setIsPayPalReady(false);
      return;
    }

    let isMounted = true;

    loadPayPalSdk({
      clientId: PAYPAL_CLIENT_ID,
      currency: PAYPAL_CURRENCY,
      locale: getPayPalLocale(initialLanguage),
    })
      .then(() => {
        if (isMounted) {
          setIsPayPalReady(true);
        }
      })
      .catch((error) => {
        console.error(error);

        if (isMounted) {
          setPaymentError(content.paymentError);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canRenderPayPal, content.paymentError, initialLanguage]);

  useEffect(() => {
    if (
      !canRenderPayPal ||
      !isPayPalReady ||
      !submission?.id ||
      !paypalContainerRef.current ||
      !window.paypal?.Buttons
    ) {
      return undefined;
    }

    paypalContainerRef.current.innerHTML = "";
    setPaymentError("");

    const buttons = window.paypal.Buttons({
      fundingSource: window.paypal.FUNDING.PAYPAL,
      style: {
        color: "gold",
        height: 48,
        label: "paypal",
        layout: "vertical",
        shape: "pill",
      },
      createOrder: async () => {
        setPaymentError("");
        setPaymentMessage("");

        const order = await createRemotePayPalOrder(submission.id);

        setSubmission((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: "payment_created",
                paymentAmount: order.amount,
                paymentCurrency: order.currency,
                paymentDisplayLabel:
                  prev.paymentDisplayLabel || order.displayLabel || DEFAULT_PAYMENT_DISPLAY_LABEL,
                paypalOrderId: order.orderId,
              }
            : prev,
        );

        return order.orderId;
      },
      onApprove: async (data) => {
        setPaymentError("");
        setPaymentMessage("");

        const result = await captureRemotePayPalOrder(submission.id, data.orderID);
        const nextSubmission = {
          ...result.submission,
          storageMode: "server",
        };

        setSubmission(nextSubmission);
        saveSurveySubmission(nextSubmission);
        setPaymentMessage(content.paymentCompleted);
      },
      onCancel: () => {
        setPaymentMessage(content.paymentCancelled);
      },
      onError: (error) => {
        console.error(error);
        setPaymentError(content.paymentError);
      },
    });

    paypalButtonsRef.current = buttons;

    if (typeof buttons.isEligible === "function" && !buttons.isEligible()) {
      setPaymentError(content.paymentUnavailable);
      return undefined;
    }

    buttons.render(paypalContainerRef.current).catch((error) => {
      console.error(error);
      setPaymentError(content.paymentError);
    });

    return () => {
      if (paypalButtonsRef.current?.close) {
        paypalButtonsRef.current.close();
      }

      paypalButtonsRef.current = null;

      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = "";
      }
    };
  }, [
    canRenderPayPal,
    content.paymentCancelled,
    content.paymentCompleted,
    content.paymentError,
    content.paymentUnavailable,
    isPayPalReady,
    submission?.id,
  ]);

  return (
    <main className="survey-page">
      <div className="survey-backdrop survey-backdrop-left" />
      <div className="survey-backdrop survey-backdrop-right" />

      <header className="survey-topbar">
        <div className="survey-brand-block">
          <Link className="survey-back-link" href={`/?lang=${initialLanguage}`}>
            {content.back}
          </Link>
          <div className="survey-brandmark">{content.brand}</div>
        </div>
      </header>

      <section className="survey-hero">
        <div className="survey-hero-copy">
          <span className="survey-kicker">{content.heroKicker}</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroSubtitle}</p>
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
                href={`/survey?lang=${initialLanguage}`}
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
                href={`/survey?lang=${initialLanguage}`}
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

            <p className="survey-main-description">{content.summaryDescription}</p>

            <div className="survey-complete-grid">
              {submission.summary.map((item) => (
                <div className="survey-complete-summary-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            {isServerSubmission ? (
              <div className="survey-inline-payment">
                <div className="survey-inline-payment-copy">
                  <span className="survey-card-kicker">{content.paymentReadyLabel}</span>
                  <strong>$150 USD</strong>
                </div>
              </div>
            ) : null}

            {isServerSubmission && (PAYPAL_CLIENT_ID || paymentMessage || paymentError) ? (
              <div className="survey-payment-shell">
                {!PAYPAL_CLIENT_ID ? (
                  <p className="survey-payment-helper">{content.paymentSdkMissing}</p>
                ) : !isPayPalReady && paymentStatus !== "paid" ? (
                  <p className="survey-payment-helper">{content.paymentLoadingSdk}</p>
                ) : paymentStatus === "paid" ? null : (
                  <div
                    className="survey-paypal-button"
                    ref={paypalContainerRef}
                  />
                )}
                <p className="survey-payment-helper">{content.paymentButtonHint}</p>
                {paymentMessage ? (
                  <p className="survey-payment-message">{paymentMessage}</p>
                ) : null}
                {paymentError ? (
                  <p className="survey-submit-error">{paymentError}</p>
                ) : null}
              </div>
            ) : null}

            <div className="survey-complete-actions">
              <Link className="survey-primary-button" href={`/?lang=${initialLanguage}`}>
                {content.homeAction}
              </Link>
              <Link
                className="survey-secondary-link"
                href={`/survey?lang=${initialLanguage}`}
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
