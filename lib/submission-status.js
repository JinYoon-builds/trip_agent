import { normalizeSiteLanguage } from "./language";

export const SUBMISSION_STATUS_ORDER = [
  "awaiting_transfer",
  "payment_review",
  "paid",
  "matched",
  "cancelled",
];

const statusCopy = {
  en: {
    awaiting_transfer: "Awaiting transfer",
    payment_review: "Payment review",
    paid: "Paid",
    matched: "Matched",
    cancelled: "Cancelled",
  },
  ko: {
    awaiting_transfer: "입금 확인 대기",
    payment_review: "결제 검토 중",
    paid: "결제 완료",
    matched: "매칭 완료",
    cancelled: "취소됨",
  },
  zh: {
    awaiting_transfer: "等待转账确认",
    payment_review: "付款审核中",
    paid: "支付完成",
    matched: "匹配完成",
    cancelled: "已取消",
  },
};

export function getSubmissionStatusLabel(status, language) {
  const normalizedLanguage = normalizeSiteLanguage(language);

  return (
    statusCopy[normalizedLanguage]?.[status] ??
    statusCopy.zh[status] ??
    status
  );
}
