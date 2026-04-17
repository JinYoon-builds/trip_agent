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
  if (submission?.quoted_display_label) {
    return submission.quoted_display_label;
  }

  const amount =
    submission?.quoted_amount !== null &&
    submission?.quoted_amount !== undefined &&
    submission?.quoted_amount !== ""
      ? String(submission.quoted_amount).trim()
      : "";
  const currency =
    typeof submission?.quoted_currency === "string"
      ? submission.quoted_currency.trim()
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
      subject: `[刘Unnie] 설문 완료 / 결제금액: ${amountLabel} / 입금자명: ${applicantName}`,
      text: [
        "A new 刘Unnie survey has been submitted.",
        "Manual transfer is not confirmed yet and should be checked.",
        "",
        `Quoted amount: ${amountLabel}`,
        `Sender name: ${applicantName}`,
        `Submission ID: ${submission.id}`,
        `Contact email: ${submission.contact_email}`,
        `Submitted at: ${submittedAt}`,
        `Submission status: ${submission.submission_status ?? "-"}`,
        "",
        summaryText,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;background:#f7f2ff;padding:24px;color:#1f1633;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #eadfff;">
            <p style="margin:0 0 8px;color:#8659ff;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">刘Unnie</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">New survey received</h1>
            <p style="margin:0 0 24px;color:#5f536f;">A customer finished the survey. Manual transfer is not confirmed yet and should be checked.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fcf9ff;border-radius:16px;overflow:hidden;">
              <tbody>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Quoted amount</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(amountLabel)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Sender name</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(applicantName)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Submission ID</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submission.id)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Contact email</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submission.contact_email)}</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;color:#6b5b85;">Submitted at</td><td style="padding:8px 12px;border-bottom:1px solid #e7dff5;font-weight:600;">${escapeHtml(submittedAt)}</td></tr>
                <tr><td style="padding:8px 12px;color:#6b5b85;">Submission status</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(submission.submission_status || "-")}</td></tr>
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
