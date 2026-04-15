import { getResendConfig } from "./integration-config";
import { formatSummaryAsText } from "./submission-utils";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildSummaryHtml(summary) {
  return summary
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">${escapeHtml(item.label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#1f1633;font-weight:600;">${escapeHtml(item.value)}</td></tr>`,
    )
    .join("");
}

function getApplicantName(submission) {
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

  return summaryName || "Unknown";
}

function getSubmissionAmountLabel(submission) {
  if (submission?.payment_display_label) {
    return submission.payment_display_label;
  }

  const amount =
    submission?.payment_amount !== null &&
    submission?.payment_amount !== undefined &&
    submission?.payment_amount !== ""
      ? String(submission.payment_amount).trim()
      : "";
  const currency =
    typeof submission?.payment_currency === "string"
      ? submission.payment_currency.trim()
      : "";

  return [amount, currency].filter(Boolean).join(" ") || "-";
}

export async function sendSubmissionReceivedNotification({ submission }) {
  const { apiKey, emailFrom, notificationEmails } = getResendConfig();
  const summaryText = formatSummaryAsText(submission.summary);
  const submittedAt = submission.created_at ?? new Date().toISOString();
  const applicantName = getApplicantName(submission);
  const amountLabel = getSubmissionAmountLabel(submission);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: notificationEmails,
      subject: `[liu-unnie] 설문 완료 / 결제금액: ${amountLabel} / 입금자명: ${applicantName}`,
      text: [
        "A new liu-unnie survey has been submitted.",
        "Payment is not confirmed yet and should be checked.",
        "",
        `Quoted amount: ${amountLabel}`,
        `Sender name: ${applicantName}`,
        `Submission ID: ${submission.id}`,
        `Contact email: ${submission.contact_email}`,
        `Submitted at: ${submittedAt}`,
        `Payment status: ${submission.payment_status ?? "-"}`,
        "",
        summaryText,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;background:#f7f2ff;padding:24px;color:#1f1633;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #eadfff;">
            <p style="margin:0 0 8px;color:#8659ff;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">liu-unnie</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">New survey received</h1>
            <p style="margin:0 0 24px;color:#5f536f;">A customer finished the survey. Payment is not confirmed yet and should be checked.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fcf9ff;border-radius:16px;overflow:hidden;">
              <tbody>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Quoted amount</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(amountLabel)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Sender name</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(applicantName)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Submission ID</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submission.id)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Contact email</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submission.contact_email)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Submitted at</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submittedAt)}</td></tr>
                <tr><td style="padding:8px 12px;color:#6b5b85;">Payment status</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(submission.payment_status || "-")}</td></tr>
              </tbody>
            </table>
            <table style="width:100%;border-collapse:collapse;">
              <tbody>
                ${buildSummaryHtml(submission.summary)}
              </tbody>
            </table>
          </div>
        </div>`,
    }),
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || "Failed to send notification email.");

    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function sendPaidSubmissionNotification({ submission, captureDetails }) {
  const { apiKey, emailFrom, notificationEmails } = getResendConfig();
  const summaryText = formatSummaryAsText(submission.summary);
  const submittedAt = submission.created_at ?? new Date().toISOString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: notificationEmails,
      subject: `[liu-unnie] Paid survey ${submission.id}`,
      text: [
        "A liu-unnie survey has been paid.",
        "",
        `Submission ID: ${submission.id}`,
        `Contact email: ${submission.contact_email}`,
        `PayPal payer email: ${captureDetails.payerEmail ?? "-"}`,
        `Submitted at: ${submittedAt}`,
        `PayPal order ID: ${captureDetails.orderId}`,
        `PayPal capture ID: ${captureDetails.captureId}`,
        `Amount: ${captureDetails.amount ?? "-"} ${captureDetails.currency ?? ""}`.trim(),
        "",
        summaryText,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;background:#f7f2ff;padding:24px;color:#1f1633;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #eadfff;">
            <p style="margin:0 0 8px;color:#8659ff;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">liu-unnie</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Paid survey received</h1>
            <p style="margin:0 0 24px;color:#5f536f;">The customer finished payment and their survey is ready for follow-up.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fcf9ff;border-radius:16px;overflow:hidden;">
              <tbody>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Submission ID</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submission.id)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Contact email</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submission.contact_email)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">PayPal payer email</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(captureDetails.payerEmail || "-")}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Submitted at</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submittedAt)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">PayPal order ID</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(captureDetails.orderId || "-")}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">PayPal capture ID</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(captureDetails.captureId || "-")}</td></tr>
                <tr><td style="padding:8px 12px;color:#6b5b85;">Amount</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(`${captureDetails.amount ?? "-"} ${captureDetails.currency ?? ""}`.trim())}</td></tr>
              </tbody>
            </table>
            <table style="width:100%;border-collapse:collapse;">
              <tbody>
                ${buildSummaryHtml(submission.summary)}
              </tbody>
            </table>
          </div>
        </div>`,
    }),
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || "Failed to send notification email.");

    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}
