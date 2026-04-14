"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  createSurveySubmissionId,
  saveSurveySubmission,
} from "../../lib/survey-local-storage";
import { createRemoteSubmission } from "../../lib/submission-client";

const DEFAULT_PAYMENT_DISPLAY_LABEL = "₩200,000";

const sharedSummaryItems = [
  { label: "Name 姓名", fieldId: "fullName" },
  { label: "Contact Email 联系邮箱", fieldId: "contactEmail" },
  { label: "Destination 旅行目的地", fieldId: "destination" },
  { label: "Dates 旅行时间", fieldId: "travelDates" },
  { label: "Main Goals 旅行目的", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
];

const sharedSteps = [
  {
    id: "basicInformation",
    title: "Basic Information 基本信息",
    description:
      "Start with your essential personal details. 请先填写您的基本个人信息。",
    fields: [
      {
        id: "fullName",
        kind: "text",
        label: "First + Last Name 姓名 *",
        placeholder: "e.g. Jane Doe",
        required: true,
      },
      {
        id: "contactEmail",
        kind: "text",
        inputType: "email",
        label: "Contact Email 联系邮箱 *",
        placeholder: "name@example.com",
        required: true,
      },
      {
        id: "age",
        kind: "number",
        label: "Age 年龄 *",
        placeholder: "e.g. 28",
        required: true,
      },
      {
        id: "gender",
        kind: "single",
        label: "Gender 性别 *",
        required: true,
        options: [
          { value: "male", label: "Male 男" },
          { value: "female", label: "Female 女" },
          { value: "nonbinary", label: "Nonbinary 非二元" },
        ],
      },
      {
        id: "mbti",
        kind: "text",
        label: "MBTI",
        placeholder: "e.g. ENFP",
      },
    ],
  },
  {
    id: "travelDetails",
    title: "Travel Details 旅游信息",
    description:
      "What are your travel details? 您的旅行信息是什么？",
    fields: [
      {
        id: "destination",
        kind: "text",
        label: "Visiting city & country 旅行目的地（城市，国家） *",
        placeholder: "e.g. Seoul, Korea",
        required: true,
      },
      {
        id: "travelDates",
        kind: "textarea",
        label: "What are the dates you are traveling? 旅行时间 *",
        placeholder:
          "ex: Seoul (4/14/2026-4/18/2026), Busan (4/18/2026-4/29/2026)",
        required: true,
      },
      {
        id: "travelCompanion",
        kind: "single",
        label: "Who are you traveling with? 您和谁一起旅行？ *",
        required: true,
        options: [
          { value: "solo", label: "Solo 独自" },
          { value: "friends", label: "Friends 朋友" },
          { value: "partner", label: "Partner 情侣" },
          { value: "family", label: "Family 家人" },
          { value: "business", label: "Business 商务" },
        ],
      },
      {
        id: "mainGoals",
        kind: "multi",
        label:
          "What are the main goals of this trip? (choose 3) 这次旅行最重要的目的是什么？(最多选择3项) *",
        required: true,
        maxSelections: 3,
        options: [
          { value: "relaxation", label: "Relaxation 放松" },
          { value: "shopping", label: "Shopping 购物" },
          { value: "foodCafes", label: "Food/Cafes 美食/咖啡店" },
          { value: "kcontent", label: "K-pop/K-drama 韩流" },
          { value: "culture", label: "Culture 文化" },
          { value: "nature", label: "Nature 自然" },
          { value: "beautyFashion", label: "Beauty/Fashion 美妆 / 时尚" },
          { value: "other", label: "Other 其他" },
        ],
      },
      {
        id: "mainGoalsOther",
        kind: "text",
        label: "Other 其他",
        placeholder: "Please specify / 请填写",
        showWhen: (answers) =>
          Array.isArray(answers.mainGoals) && answers.mainGoals.includes("other"),
      },
    ],
  },
  {
    id: "travelType",
    title: "Travel Type 旅行类型",
    description:
      "What is your travel style like? 您的旅行风格更偏向哪种？",
    fields: [
      {
        id: "scheduleFeel",
        kind: "single",
        label: "How would you like your schedule to feel? 您希望旅行节奏是？ *",
        required: true,
        options: [
          { value: "relaxed", label: "Relaxed (1-2 activities/day) 轻松（每天1-2个行程）" },
          { value: "balanced", label: "Balanced (3-4 activities/day) 适中（3-4个）" },
          { value: "packed", label: "Packed (as many as possible) 紧凑（尽可能多）" },
        ],
      },
      {
        id: "planningStyle",
        kind: "single",
        label: "What's your planning style? 您的旅行规划风格是？ *",
        required: true,
        options: [
          { value: "fullyPlanned", label: "Fully planned (detailed schedule) 详细计划型" },
          { value: "semiPlanned", label: "Semi-planned (main structure only) 大致规划型" },
          { value: "spontaneous", label: "Spontaneous (decide on the go) 随性即兴型" },
        ],
      },
      {
        id: "budgetLevel",
        kind: "single",
        label: "Budget & spending 请选择您的预算 *",
        required: true,
        options: [
          { value: "tight", label: "Tight budget 经济型" },
          { value: "standard", label: "Standard 普通" },
          { value: "premium", label: "Premium 高端" },
          { value: "luxury", label: "Luxury 奢华" },
        ],
      },
      {
        id: "preferenceRanking",
        kind: "textarea",
        label: "Preference (rank in order) 偏好排序（请按重要性排序） *",
        placeholder:
          "e.g. 1. Food/Cafes 2. Shopping 3. Culture",
        required: true,
      },
      {
        id: "mustDo",
        kind: "textarea",
        label: "What are things you must do during this trip? 这次旅行中，你一定要做的事情是什么？ *",
        placeholder: "Please list the must-do experiences for this trip.",
        required: true,
      },
      {
        id: "avoidDuringTrip",
        kind: "textarea",
        label: "What are things you want to avoid during the trip? 这次旅行中，你想要避免的事情是什么？ *",
        placeholder: "Please share what you want to avoid during the trip.",
        required: true,
      },
    ],
  },
];

const surveyContent = {
  ko: {
    brand: "tripagent",
    back: "Back to home",
    title: "All-in-one Travel Service",
    subtitle:
      "Travel made easy. From planning to the end, your trip is fully taken care of. 让旅行更简单。从规划到结束，全程为您打理。",
    sidebarKicker: "Travel Service",
    sidebarTitle: "Survey Progress",
    sidebarText:
      "This survey has 3 pages. Fill in the key details so we can understand your trip clearly.",
    progressLabel: "Progress",
    summaryTitle: "Quick Summary",
    summaryFallback: "Not yet",
    summaryItems: sharedSummaryItems,
    cardKicker: "Page",
    cardPill: "Question Form",
    previous: "Previous",
    next: "Next",
    finish: "Submit Survey",
    submitting: "Saving...",
    submitError:
      "We could not save your survey just now. Please try again.",
    requiredFieldError:
      "Please fill in all required fields before submitting.",
    emailRequiredError: "Please enter a valid contact email.",
    selectionCount: "Selected",
    maxSelectionText: (count) => `Choose up to ${count}`,
    steps: sharedSteps,
  },
  zh: {
    brand: "tripagent",
    back: "返回首页",
    title: "All-in-one Travel Service 一站式旅行服务",
    subtitle:
      "让旅行更简单。从规划到结束，全程为您打理。Travel made easy. From planning to the end, your trip is fully taken care of.",
    sidebarKicker: "旅行服务",
    sidebarTitle: "问卷进度",
    sidebarText:
      "问卷共 3 页。请填写关键信息，方便我们更准确地理解你的旅行需求。",
    progressLabel: "进度",
    summaryTitle: "快速摘要",
    summaryFallback: "待填写",
    summaryItems: sharedSummaryItems,
    cardKicker: "页面",
    cardPill: "问卷表单",
    previous: "上一步",
    next: "下一步",
    finish: "提交问卷",
    submitting: "保存中...",
    submitError:
      "暂时无法保存问卷，请稍后再试。",
    requiredFieldError:
      "请先填写所有必填项后再提交。",
    emailRequiredError: "请输入正确的联系邮箱地址。",
    selectionCount: "已选",
    maxSelectionText: (count) => `最多选择 ${count} 项`,
    steps: sharedSteps,
  },
};

function isFieldVisible(field, answers) {
  if (!field.showWhen) {
    return true;
  }

  return field.showWhen(answers);
}

function isFieldAnswered(field, answers) {
  if (field.kind === "multi") {
    return Array.isArray(answers[field.id]) && answers[field.id].length > 0;
  }

  if (field.kind === "datetimeRange") {
    return Boolean(answers[field.startId] && answers[field.endId]);
  }

  return typeof answers[field.id] === "string"
    ? answers[field.id].trim().length > 0
    : Boolean(answers[field.id]);
}

function countVisibleFields(step, answers) {
  return step.fields.filter((field) => isFieldVisible(field, answers)).length;
}

function countAnsweredFields(step, answers) {
  return step.fields
    .filter((field) => isFieldVisible(field, answers))
    .reduce((count, field) => count + (isFieldAnswered(field, answers) ? 1 : 0), 0);
}

function getFieldLabelByValue(field, value) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function formatDateTimeValue(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return value.replace("T", " ");
}

function formatSummaryValue({ field, answers, fallback, extraFieldId }) {
  if (!field) {
    return fallback;
  }

  if (field.kind === "multi") {
    const values = Array.isArray(answers[field.id]) ? answers[field.id] : [];
    const labels = values.map((value) => getFieldLabelByValue(field, value));

    if (extraFieldId && typeof answers[extraFieldId] === "string" && answers[extraFieldId].trim()) {
      labels.push(answers[extraFieldId].trim());
    }

    return labels.length > 0 ? labels.join(" · ") : fallback;
  }

  if (field.kind === "single") {
    return answers[field.id] ? getFieldLabelByValue(field, answers[field.id]) : fallback;
  }

  if (field.kind === "datetimeRange") {
    const start = answers[field.startId];
    const end = answers[field.endId];

    return start && end
      ? `${formatDateTimeValue(start)} - ${formatDateTimeValue(end)}`
      : fallback;
  }

  if (typeof answers[field.id] === "string" && answers[field.id].trim()) {
    return answers[field.id].trim();
  }

  return fallback;
}

function joinSummaryValues(values, fallback) {
  const filteredValues = values.filter(
    (value) => typeof value === "string" && value.trim(),
  );

  return filteredValues.length > 0 ? filteredValues.join(" · ") : fallback;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function shouldFallBackToLocalSave(error) {
  if (typeof error?.status === "number") {
    return error.status === 503;
  }

  return error instanceof TypeError;
}

function findFirstMissingRequiredField(steps, answers) {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    for (const field of steps[stepIndex].fields) {
      if (!field.required || !isFieldVisible(field, answers)) {
        continue;
      }

      if (!isFieldAnswered(field, answers)) {
        return { stepIndex, fieldId: field.id };
      }
    }
  }

  return null;
}

function SurveyField({
  content,
  field,
  fieldValue,
  language,
  onMultiToggle,
  onSingleChange,
  onTextChange,
}) {
  if (field.kind === "single") {
    return (
      <div className="survey-option-grid">
        {field.options.map((option) => {
          const active = fieldValue === option.value;

          return (
            <button
              aria-pressed={active}
              className={active ? "survey-option-card active" : "survey-option-card"}
              key={option.value}
              onClick={() => onSingleChange(field.id, option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.kind === "multi") {
    const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];

    return (
      <>
        <div className="survey-field-meta">
          {field.maxSelections ? (
            <span>{content.maxSelectionText(field.maxSelections)}</span>
          ) : (
            <span>&nbsp;</span>
          )}
          <strong>
            {content.selectionCount} {selectedValues.length}
          </strong>
        </div>

        <div className="survey-chip-grid">
          {field.options.map((option) => {
            const active = selectedValues.includes(option.value);
            const disabled =
              Boolean(field.maxSelections) &&
              !active &&
              selectedValues.length >= field.maxSelections;

            return (
              <button
                aria-pressed={active}
                className={active ? "survey-chip-button active" : "survey-chip-button"}
                disabled={disabled}
                key={option.value}
                onClick={() => onMultiToggle(field.id, option.value, field.maxSelections)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (field.kind === "textarea") {
    return (
      <textarea
        className="survey-textarea"
        onChange={(event) => onTextChange(field.id, event.target.value)}
        placeholder={field.placeholder}
        rows={5}
        value={fieldValue ?? ""}
      />
    );
  }

  if (field.kind === "datetimeRange") {
    return (
      <div className="survey-range-grid">
        <label className="survey-subfield">
          <span>{content.arrivalLabel}</span>
          <input
            className="survey-input"
            onChange={(event) => onTextChange(field.startId, event.target.value)}
            type="datetime-local"
            value={fieldValue?.start ?? ""}
          />
        </label>
        <label className="survey-subfield">
          <span>{content.departureLabel}</span>
          <input
            className="survey-input"
            onChange={(event) => onTextChange(field.endId, event.target.value)}
            type="datetime-local"
            value={fieldValue?.end ?? ""}
          />
        </label>
      </div>
    );
  }

  const datalistId =
    field.suggestionsKey && Array.isArray(content[field.suggestionsKey])
      ? `${field.id}-${language}-suggestions`
      : undefined;

  return (
    <>
      <input
        className="survey-input"
        list={datalistId}
        min={field.kind === "number" ? 1 : undefined}
        onChange={(event) => onTextChange(field.id, event.target.value)}
        placeholder={field.placeholder}
        type={field.kind === "number" ? "number" : field.inputType ?? "text"}
        value={fieldValue ?? ""}
      />
      {datalistId ? (
        <datalist id={datalistId}>
          {content[field.suggestionsKey].map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}

export default function SurveyClient({ initialLanguage }) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState(initialLanguage);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  const content = surveyContent[language];
  const steps = content.steps;
  const currentStep = steps[currentStepIndex];
  const visibleFields = currentStep.fields.filter((field) => isFieldVisible(field, answers));
  const answeredCurrentStep = countAnsweredFields(currentStep, answers);
  const totalCurrentStep = countVisibleFields(currentStep, answers);
  const answeredOverall = steps.reduce((count, step) => count + countAnsweredFields(step, answers), 0);
  const totalFields = steps.reduce((count, step) => count + countVisibleFields(step, answers), 0);

  const fieldMap = useMemo(() => {
    const map = new Map();

    steps.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.id) {
          map.set(field.id, field);
        }
      });
    });

    return map;
  }, [steps]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    router.replace(`${pathname}?lang=${nextLanguage}`, { scroll: false });
  };

  const handleTextChange = (fieldId, value) => {
    setSubmitError("");
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSingleChange = (fieldId, value) => {
    setSubmitError("");
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleMultiToggle = (fieldId, value, maxSelections) => {
    setSubmitError("");
    setAnswers((prev) => {
      const currentValues = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];

      if (currentValues.includes(value)) {
        return {
          ...prev,
          [fieldId]: currentValues.filter((item) => item !== value),
        };
      }

      if (maxSelections && currentValues.length >= maxSelections) {
        return prev;
      }

      return {
        ...prev,
        [fieldId]: [...currentValues, value],
      };
    });
  };

  const buildSubmissionSummary = () => {
    const fullName = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("fullName"),
    });
    const destination = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("destination"),
    });
    const contactEmail = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("contactEmail"),
    });
    const travelDates = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("travelDates"),
    });
    const age = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("age"),
    });
    const gender = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("gender"),
    });
    const mbti = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("mbti"),
    });
    const travelCompanion = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("travelCompanion"),
    });
    const mainGoals = formatSummaryValue({
      answers,
      extraFieldId: "mainGoalsOther",
      fallback: content.summaryFallback,
      field: fieldMap.get("mainGoals"),
    });
    const scheduleFeel = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("scheduleFeel"),
    });
    const planningStyle = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("planningStyle"),
    });
    const budgetLevel = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("budgetLevel"),
    });
    const preferenceRanking = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("preferenceRanking"),
    });
    const mustDo = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("mustDo"),
    });
    const avoidDuringTrip = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("avoidDuringTrip"),
    });

    return [
      { label: "Name 姓名", value: fullName },
      { label: "Contact Email 联系邮箱", value: contactEmail },
      {
        label: "Age / Gender / MBTI",
        value: joinSummaryValues(
          [age, gender, mbti],
          content.summaryFallback,
        ),
      },
      { label: "Destination 旅行目的地", value: destination },
      { label: "Dates 旅行时间", value: travelDates },
      { label: "Traveling With 同行", value: travelCompanion },
      { label: "Main Goals 旅行目的", value: mainGoals },
      {
        label: "Travel Style 旅行风格",
        value: joinSummaryValues(
          [scheduleFeel, planningStyle],
          content.summaryFallback,
        ),
      },
      { label: "Budget 预算", value: budgetLevel },
      { label: "Preference Ranking 偏好排序", value: preferenceRanking },
      { label: "Must Do 必做事项", value: mustDo },
      { label: "Avoid 避免事项", value: avoidDuringTrip },
    ];
  };

  const handleSubmit = async () => {
    const missingRequiredField = findFirstMissingRequiredField(steps, answers);

    if (missingRequiredField) {
      setCurrentStepIndex(missingRequiredField.stepIndex);
      setSubmitError(content.requiredFieldError);
      return;
    }

    const contactEmail =
      typeof answers.contactEmail === "string" ? answers.contactEmail.trim() : "";

    if (!isValidEmail(contactEmail)) {
      setCurrentStepIndex(0);
      setSubmitError(content.emailRequiredError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const submissionPayload = {
        language,
        contactEmail,
        answers: {
          ...answers,
        },
        summary: buildSubmissionSummary(),
      };
      let submission = null;

      try {
        submission = await createRemoteSubmission(submissionPayload);
      } catch (error) {
        if (!shouldFallBackToLocalSave(error)) {
          throw error;
        }
      }

      if (submission?.id) {
        saveSurveySubmission({
          ...submission,
          storageMode: "server",
        });
        router.push(`/survey/complete?id=${submission.id}&lang=${language}`);
        return;
      }

      const submissionId = createSurveySubmissionId();
      const localSubmission = {
        id: submissionId,
        language,
        contactEmail,
        answers: {
          ...answers,
          contactEmail,
        },
        summary: submissionPayload.summary,
        submittedAt: new Date().toISOString(),
        paymentDisplayLabel: DEFAULT_PAYMENT_DISPLAY_LABEL,
        paymentStatus: "pending_payment",
        storageMode: "local",
      };
      const didSave = saveSurveySubmission(localSubmission);

      if (!didSave) {
        throw new Error("Failed to save submission locally.");
      }

      router.push(`/survey/complete?id=${submissionId}&lang=${language}`);
    } catch (error) {
      console.error(error);
      setSubmitError(content.submitError);
      setIsSubmitting(false);
    }
  };

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

        <div className="language-switch" role="tablist" aria-label="language switch">
          <button
            className={language === "ko" ? "lang-chip active" : "lang-chip"}
            onClick={() => handleLanguageChange("ko")}
            type="button"
          >
            EN
          </button>
          <button
            className={language === "zh" ? "lang-chip active" : "lang-chip"}
            onClick={() => handleLanguageChange("zh")}
            type="button"
          >
            中文
          </button>
        </div>
      </header>

      <section className="survey-hero">
        <div className="survey-hero-copy">
          <span className="survey-kicker">{content.sidebarKicker}</span>
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>
      </section>

      <section className="survey-shell">
        <aside className="survey-side-panel">
          <div className="survey-side-card">
            <span className="survey-card-kicker">{content.sidebarKicker}</span>
            <h2>{content.sidebarTitle}</h2>
            <p>{content.sidebarText}</p>

            <div className="survey-progress-card">
              <span>{content.progressLabel}</span>
              <strong>
                {currentStepIndex + 1} / {steps.length}
              </strong>
              <div className="survey-progress-track">
                <div
                  className="survey-progress-value"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
              <small>
                {answeredOverall} / {totalFields}
              </small>
            </div>

            <div className="survey-step-list">
              {steps.map((step, index) => {
                const answeredCount = countAnsweredFields(step, answers);
                const totalCount = countVisibleFields(step, answers);

                return (
                  <button
                    className={index === currentStepIndex ? "survey-step-item active" : "survey-step-item"}
                    key={step.id}
                    onClick={() => setCurrentStepIndex(index)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div className="survey-step-copy">
                      <strong>{step.title}</strong>
                      <small>
                        {answeredCount} / {totalCount}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="survey-side-card compact">
            <span className="survey-card-kicker">{content.summaryTitle}</span>
            <div className="survey-summary-list">
              {content.summaryItems.map((item) => (
                <div className="survey-summary-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>
                    {formatSummaryValue({
                      answers,
                      extraFieldId: item.extraFieldId,
                      fallback: content.summaryFallback,
                      field: fieldMap.get(item.fieldId),
                    })}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="survey-main-card">
          <div className="survey-main-header">
            <div>
              <span className="survey-card-kicker">
                {content.cardKicker} {String(currentStepIndex + 1).padStart(2, "0")}
              </span>
              <h2>{currentStep.title}</h2>
            </div>
            <div className="survey-main-pill">{content.cardPill}</div>
          </div>

          <p className="survey-main-description">{currentStep.description}</p>

          <div className="survey-step-meta">
            <span>
              {answeredCurrentStep} / {totalCurrentStep}
            </span>
          </div>

          <div className="survey-field-stack">
            {visibleFields.map((field) => {
              const fieldValue =
                field.kind === "datetimeRange"
                  ? {
                      start: answers[field.startId] ?? "",
                      end: answers[field.endId] ?? "",
                    }
                  : answers[field.id];

              return (
                <div className="survey-field-block" key={field.id}>
                  <label>{field.label}</label>
                  <SurveyField
                    content={content}
                    field={field}
                    fieldValue={fieldValue}
                    language={language}
                    onMultiToggle={handleMultiToggle}
                    onSingleChange={handleSingleChange}
                    onTextChange={handleTextChange}
                  />
                </div>
              );
            })}
          </div>

          <div className="survey-main-actions">
            <button
              className="survey-secondary-button"
              disabled={currentStepIndex === 0 || isSubmitting}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              type="button"
            >
              {content.previous}
            </button>
            <button
              className="survey-primary-button"
              disabled={isSubmitting}
              onClick={
                currentStepIndex === steps.length - 1
                  ? handleSubmit
                  : () =>
                      setCurrentStepIndex((prev) =>
                        Math.min(steps.length - 1, prev + 1),
                      )
              }
              type="button"
            >
              {isSubmitting
                ? content.submitting
                : currentStepIndex === steps.length - 1
                  ? content.finish
                  : content.next}
            </button>
          </div>
          {submitError ? <p className="survey-submit-error">{submitError}</p> : null}
        </div>
      </section>
    </main>
  );
}
