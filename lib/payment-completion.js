import { isResendConfigured } from "./integration-config";
import { sendPaymentCompletedNotifications } from "./resend";
import {
  claimPaymentCompletedEmailLock,
  getSurveySubmissionById,
  updateSurveySubmission,
} from "./supabase-admin";

export async function finalizePaidSubmission(submission, patch = {}) {
  const shouldPersistStatusPatch =
    submission?.submission_status !== "paid" || Object.keys(patch).length > 0;
  const basePatch = {
    ...patch,
    submission_status: "paid",
    paid_at: patch.paid_at ?? submission?.paid_at ?? new Date().toISOString(),
    payment_completed_email_error: null,
  };

  const updatedSubmission =
    shouldPersistStatusPatch
      ? await updateSurveySubmission(submission.id, basePatch)
      : {
          ...submission,
          ...basePatch,
        };

  if (!isResendConfigured()) {
    return {
      submission: updatedSubmission,
      paymentCompletedEmailSent: false,
      paymentCompletedEmailError: null,
    };
  }

  if (updatedSubmission.payment_completed_email_sent_at) {
    return {
      submission: updatedSubmission,
      paymentCompletedEmailSent: true,
      paymentCompletedEmailError: updatedSubmission.payment_completed_email_error ?? null,
    };
  }

  const lockedSubmission = await claimPaymentCompletedEmailLock(updatedSubmission.id);

  if (!lockedSubmission) {
    const latestSubmission = await getSurveySubmissionById(updatedSubmission.id);

    return {
      submission: latestSubmission ?? updatedSubmission,
      paymentCompletedEmailSent: Boolean(
        latestSubmission?.payment_completed_email_sent_at,
      ),
      paymentCompletedEmailError:
        latestSubmission?.payment_completed_email_error ?? null,
    };
  }

  try {
    await sendPaymentCompletedNotifications({
      submission: lockedSubmission,
    });
    const emailedSubmission = await updateSurveySubmission(updatedSubmission.id, {
      payment_completed_email_lock_at: null,
      payment_completed_email_sent_at: new Date().toISOString(),
      payment_completed_email_error: null,
    });

    return {
      submission: emailedSubmission,
      paymentCompletedEmailSent: true,
      paymentCompletedEmailError: null,
    };
  } catch (error) {
    console.error(error);

    const paymentCompletedEmailError =
      typeof error?.message === "string"
        ? error.message
        : "Failed to send payment completion email.";
    const failedEmailSubmission = await updateSurveySubmission(updatedSubmission.id, {
      payment_completed_email_lock_at: null,
      payment_completed_email_error: paymentCompletedEmailError,
    });

    return {
      submission: failedEmailSubmission,
      paymentCompletedEmailSent: false,
      paymentCompletedEmailError,
    };
  }
}
