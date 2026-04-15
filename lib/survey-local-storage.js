const STORAGE_KEY_PREFIX = "liu-unnie-survey-submission:";
const LEGACY_STORAGE_KEY_PREFIXES = [
  "lie-unnie-survey-submission:",
  "tripagent-survey-submission:",
];

export function createSurveySubmissionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `survey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveSurveySubmission(submission) {
  if (typeof window === "undefined") {
    return false;
  }

  window.localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${submission.id}`,
    JSON.stringify(submission),
  );

  return true;
}

export function readSurveySubmission(submissionId) {
  if (typeof window === "undefined" || !submissionId) {
    return null;
  }

  const rawValue =
    window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${submissionId}`) ??
    LEGACY_STORAGE_KEY_PREFIXES.map((prefix) =>
      window.localStorage.getItem(`${prefix}${submissionId}`),
    ).find(Boolean);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}
