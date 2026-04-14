"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { normalizeSiteLanguage } from "../../lib/language";
import {
  createSurveySubmissionId,
  saveSurveySubmission,
} from "../../lib/survey-local-storage";
import { createRemoteSubmission } from "../../lib/submission-client";

const DEFAULT_PAYMENT_DISPLAY_LABEL = "₩200,000";

const surveyContent = {
  en: {
    brand: "tripagent",
    back: "Back to home",
    title: "All-in-one Travel Service",
    subtitle:
      "Travel made easy. From planning to the end, your trip is fully taken care of.",
    sidebarKicker: "Travel Service",
    sidebarTitle: "Survey Progress",
    sidebarText:
      "This survey has 3 pages. Fill in the key details so we can understand your trip clearly.",
    progressLabel: "Progress",
    summaryTitle: "Quick Summary",
    summaryFallback: "Not yet",
    summaryItems: [
      { label: "Name", fieldId: "fullName" },
      { label: "Contact Email", fieldId: "contactEmail" },
      { label: "Destination", fieldId: "destination" },
      { label: "Travel Dates", fieldId: "travelDates" },
      { label: "Main Goals", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
    ],
    summaryProfileLabel: "Age / Gender / MBTI",
    summaryWithLabel: "Traveling With",
    summaryStyleLabel: "Travel Style",
    summaryBudgetLabel: "Budget",
    summaryPreferenceLabel: "Preference Ranking",
    summaryMustDoLabel: "Must Do",
    summaryAvoidLabel: "Avoid",
    arrivalLabel: "Start Date",
    departureLabel: "End Date",
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
    steps: [
      {
        id: "basicInformation",
        title: "Basic Information",
        description: "Start with your essential personal details.",
        fields: [
          {
            id: "fullName",
            kind: "text",
            label: "First + Last Name *",
            placeholder: "e.g. Jane Doe",
            required: true,
          },
          {
            id: "contactEmail",
            kind: "text",
            inputType: "email",
            label: "Contact Email *",
            placeholder: "name@example.com",
            required: true,
          },
          {
            id: "age",
            kind: "number",
            label: "Age *",
            placeholder: "e.g. 28",
            required: true,
          },
          {
            id: "gender",
            kind: "single",
            label: "Gender *",
            required: true,
            options: [
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "nonbinary", label: "Nonbinary" },
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
        title: "Travel Details",
        description: "What are your travel details?",
        fields: [
          {
            id: "destination",
            kind: "text",
            label: "Visiting city & country *",
            placeholder: "e.g. Seoul, Korea",
            required: true,
          },
          {
            id: "travelDates",
            kind: "datetimeRange",
            label: "What are the dates you are traveling? *",
            startId: "travelStartDate",
            endId: "travelEndDate",
            required: true,
          },
          {
            id: "travelCompanion",
            kind: "single",
            label: "Who are you traveling with? *",
            required: true,
            options: [
              { value: "solo", label: "Solo" },
              { value: "friends", label: "Friends" },
              { value: "partner", label: "Partner" },
              { value: "family", label: "Family" },
              { value: "business", label: "Business" },
            ],
          },
          {
            id: "mainGoals",
            kind: "multi",
            label: "What are the main goals of this trip? (choose 3) *",
            required: true,
            maxSelections: 3,
            options: [
              { value: "relaxation", label: "Relaxation" },
              { value: "shopping", label: "Shopping" },
              { value: "foodCafes", label: "Food/Cafes" },
              { value: "kcontent", label: "K-pop/K-drama" },
              { value: "culture", label: "Culture" },
              { value: "nature", label: "Nature" },
              { value: "beautyFashion", label: "Beauty/Fashion" },
              { value: "other", label: "Other" },
            ],
          },
          {
            id: "mainGoalsOther",
            kind: "text",
            label: "Other",
            placeholder: "Please specify",
            showWhen: (answers) =>
              Array.isArray(answers.mainGoals) && answers.mainGoals.includes("other"),
          },
        ],
      },
      {
        id: "travelType",
        title: "Travel Type",
        description: "What is your travel style like?",
        fields: [
          {
            id: "scheduleFeel",
            kind: "single",
            label: "How would you like your schedule to feel? *",
            required: true,
            options: [
              { value: "relaxed", label: "Relaxed (1-2 activities/day)" },
              { value: "balanced", label: "Balanced (3-4 activities/day)" },
              { value: "packed", label: "Packed (as many as possible)" },
            ],
          },
          {
            id: "planningStyle",
            kind: "single",
            label: "What's your planning style? *",
            required: true,
            options: [
              { value: "fullyPlanned", label: "Fully planned (detailed schedule)" },
              { value: "semiPlanned", label: "Semi-planned (main structure only)" },
              { value: "spontaneous", label: "Spontaneous (decide on the go)" },
            ],
          },
          {
            id: "budgetLevel",
            kind: "single",
            label: "Budget & spending *",
            required: true,
            options: [
              { value: "tight", label: "Tight budget" },
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
              { value: "luxury", label: "Luxury" },
            ],
          },
          {
            id: "preferenceRanking",
            kind: "textarea",
            label: "Preference (rank in order) *",
            placeholder: "e.g. 1. Food/Cafes 2. Shopping 3. Culture",
            required: true,
          },
          {
            id: "mustDo",
            kind: "textarea",
            label: "What are things you must do during this trip? *",
            placeholder: "Please list the must-do experiences for this trip.",
            required: true,
          },
          {
            id: "avoidDuringTrip",
            kind: "textarea",
            label: "What are things you want to avoid during the trip? *",
            placeholder: "Please share what you want to avoid during the trip.",
            required: true,
          },
        ],
      },
    ],
  },
  ko: {
    brand: "tripagent",
    back: "랜딩으로 돌아가기",
    title: "올인원 여행 서비스",
    subtitle:
      "여행 준비부터 마지막까지, 당신의 여행을 더 쉽게 만들어드립니다.",
    sidebarKicker: "여행 서비스",
    sidebarTitle: "설문 진행 상황",
    sidebarText:
      "설문은 3페이지로 구성되어 있습니다. 핵심 정보를 입력해 주시면 여행 성향을 더 정확히 이해할 수 있습니다.",
    progressLabel: "진행률",
    summaryTitle: "입력 요약",
    summaryFallback: "미입력",
    summaryItems: [
      { label: "이름", fieldId: "fullName" },
      { label: "이메일", fieldId: "contactEmail" },
      { label: "목적지", fieldId: "destination" },
      { label: "여행 기간", fieldId: "travelDates" },
      { label: "여행 목적", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
    ],
    summaryProfileLabel: "나이 / 성별 / MBTI",
    summaryWithLabel: "동행",
    summaryStyleLabel: "여행 스타일",
    summaryBudgetLabel: "예산",
    summaryPreferenceLabel: "선호 순위",
    summaryMustDoLabel: "꼭 하고 싶은 것",
    summaryAvoidLabel: "피하고 싶은 것",
    arrivalLabel: "시작일",
    departureLabel: "종료일",
    cardKicker: "페이지",
    cardPill: "설문 폼",
    previous: "이전",
    next: "다음",
    finish: "설문 제출",
    submitting: "저장 중...",
    submitError:
      "설문을 저장하지 못했습니다. 다시 시도해 주세요.",
    requiredFieldError:
      "별표(*)가 있는 필수 항목을 모두 입력해 주세요.",
    emailRequiredError: "올바른 이메일 주소를 입력해 주세요.",
    selectionCount: "선택",
    maxSelectionText: (count) => `최대 ${count}개 선택`,
    steps: [
      {
        id: "basicInformation",
        title: "기본 정보",
        description: "여행자 기본 정보를 먼저 입력해 주세요.",
        fields: [
          {
            id: "fullName",
            kind: "text",
            label: "이름 *",
            placeholder: "예: 홍길동",
            required: true,
          },
          {
            id: "contactEmail",
            kind: "text",
            inputType: "email",
            label: "이메일 *",
            placeholder: "name@example.com",
            required: true,
          },
          {
            id: "age",
            kind: "number",
            label: "나이 *",
            placeholder: "예: 28",
            required: true,
          },
          {
            id: "gender",
            kind: "single",
            label: "성별 *",
            required: true,
            options: [
              { value: "male", label: "남성" },
              { value: "female", label: "여성" },
              { value: "nonbinary", label: "논바이너리" },
            ],
          },
          {
            id: "mbti",
            kind: "text",
            label: "MBTI",
            placeholder: "예: ENFP",
          },
        ],
      },
      {
        id: "travelDetails",
        title: "여행 정보",
        description: "실제 여행 일정과 목적을 알려주세요.",
        fields: [
          {
            id: "destination",
            kind: "text",
            label: "방문 도시 및 국가 *",
            placeholder: "예: 서울, 한국",
            required: true,
          },
          {
            id: "travelDates",
            kind: "datetimeRange",
            label: "여행 일정 *",
            startId: "travelStartDate",
            endId: "travelEndDate",
            required: true,
          },
          {
            id: "travelCompanion",
            kind: "single",
            label: "누구와 함께 여행하시나요? *",
            required: true,
            options: [
              { value: "solo", label: "혼자" },
              { value: "friends", label: "친구" },
              { value: "partner", label: "연인" },
              { value: "family", label: "가족" },
              { value: "business", label: "비즈니스" },
            ],
          },
          {
            id: "mainGoals",
            kind: "multi",
            label: "이번 여행의 주요 목적은 무엇인가요? (최대 3개) *",
            required: true,
            maxSelections: 3,
            options: [
              { value: "relaxation", label: "휴식" },
              { value: "shopping", label: "쇼핑" },
              { value: "foodCafes", label: "맛집 / 카페" },
              { value: "kcontent", label: "K-pop / K-drama" },
              { value: "culture", label: "문화" },
              { value: "nature", label: "자연" },
              { value: "beautyFashion", label: "뷰티 / 패션" },
              { value: "other", label: "기타" },
            ],
          },
          {
            id: "mainGoalsOther",
            kind: "text",
            label: "기타",
            placeholder: "직접 입력해 주세요",
            showWhen: (answers) =>
              Array.isArray(answers.mainGoals) && answers.mainGoals.includes("other"),
          },
        ],
      },
      {
        id: "travelType",
        title: "여행 유형",
        description: "원하는 여행 스타일을 알려주세요.",
        fields: [
          {
            id: "scheduleFeel",
            kind: "single",
            label: "원하는 여행 일정 강도는? *",
            required: true,
            options: [
              { value: "relaxed", label: "여유롭게 (하루 1-2개)" },
              { value: "balanced", label: "적당히 (하루 3-4개)" },
              { value: "packed", label: "빡빡하게 (최대한 많이)" },
            ],
          },
          {
            id: "planningStyle",
            kind: "single",
            label: "여행 계획 스타일은? *",
            required: true,
            options: [
              { value: "fullyPlanned", label: "상세 계획형" },
              { value: "semiPlanned", label: "대략 계획형" },
              { value: "spontaneous", label: "즉흥형" },
            ],
          },
          {
            id: "budgetLevel",
            kind: "single",
            label: "예산 *",
            required: true,
            options: [
              { value: "tight", label: "절약형" },
              { value: "standard", label: "일반형" },
              { value: "premium", label: "프리미엄" },
              { value: "luxury", label: "럭셔리" },
            ],
          },
          {
            id: "preferenceRanking",
            kind: "textarea",
            label: "선호 순위를 적어주세요 *",
            placeholder: "예: 1. 맛집 2. 쇼핑 3. 문화",
            required: true,
          },
          {
            id: "mustDo",
            kind: "textarea",
            label: "이번 여행에서 꼭 하고 싶은 것은? *",
            placeholder: "꼭 하고 싶은 경험을 적어 주세요.",
            required: true,
          },
          {
            id: "avoidDuringTrip",
            kind: "textarea",
            label: "이번 여행에서 피하고 싶은 것은? *",
            placeholder: "피하고 싶은 경험을 적어 주세요.",
            required: true,
          },
        ],
      },
    ],
  },
  zh: {
    brand: "tripagent",
    back: "返回首页",
    title: "一站式旅行服务",
    subtitle:
      "让旅行更简单。从规划到结束，全程为您打理。",
    sidebarKicker: "旅行服务",
    sidebarTitle: "问卷进度",
    sidebarText:
      "问卷共 3 页。请填写关键信息，方便我们更准确地理解你的旅行需求。",
    progressLabel: "进度",
    summaryTitle: "快速摘要",
    summaryFallback: "待填写",
    summaryItems: [
      { label: "姓名", fieldId: "fullName" },
      { label: "联系邮箱", fieldId: "contactEmail" },
      { label: "目的地", fieldId: "destination" },
      { label: "旅行时间", fieldId: "travelDates" },
      { label: "旅行目的", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
    ],
    summaryProfileLabel: "年龄 / 性别 / MBTI",
    summaryWithLabel: "同行",
    summaryStyleLabel: "旅行风格",
    summaryBudgetLabel: "预算",
    summaryPreferenceLabel: "偏好排序",
    summaryMustDoLabel: "一定要做的事",
    summaryAvoidLabel: "想避免的事",
    arrivalLabel: "开始日期",
    departureLabel: "结束日期",
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
    steps: [
      {
        id: "basicInformation",
        title: "基本信息",
        description: "请先填写你的基本个人信息。",
        fields: [
          {
            id: "fullName",
            kind: "text",
            label: "姓名 *",
            placeholder: "例如：张三",
            required: true,
          },
          {
            id: "contactEmail",
            kind: "text",
            inputType: "email",
            label: "联系邮箱 *",
            placeholder: "name@example.com",
            required: true,
          },
          {
            id: "age",
            kind: "number",
            label: "年龄 *",
            placeholder: "例如：28",
            required: true,
          },
          {
            id: "gender",
            kind: "single",
            label: "性别 *",
            required: true,
            options: [
              { value: "male", label: "男" },
              { value: "female", label: "女" },
              { value: "nonbinary", label: "非二元" },
            ],
          },
          {
            id: "mbti",
            kind: "text",
            label: "MBTI",
            placeholder: "例如：ENFP",
          },
        ],
      },
      {
        id: "travelDetails",
        title: "旅游信息",
        description: "您的旅行信息是什么？",
        fields: [
          {
            id: "destination",
            kind: "text",
            label: "旅行目的地（城市，国家） *",
            placeholder: "例如：首尔，韩国",
            required: true,
          },
          {
            id: "travelDates",
            kind: "datetimeRange",
            label: "旅行时间 *",
            startId: "travelStartDate",
            endId: "travelEndDate",
            required: true,
          },
          {
            id: "travelCompanion",
            kind: "single",
            label: "您和谁一起旅行？ *",
            required: true,
            options: [
              { value: "solo", label: "独自" },
              { value: "friends", label: "朋友" },
              { value: "partner", label: "情侣" },
              { value: "family", label: "家人" },
              { value: "business", label: "商务" },
            ],
          },
          {
            id: "mainGoals",
            kind: "multi",
            label: "这次旅行最重要的目的是什么？(最多选择 3 项) *",
            required: true,
            maxSelections: 3,
            options: [
              { value: "relaxation", label: "放松" },
              { value: "shopping", label: "购物" },
              { value: "foodCafes", label: "美食 / 咖啡店" },
              { value: "kcontent", label: "韩流" },
              { value: "culture", label: "文化" },
              { value: "nature", label: "自然" },
              { value: "beautyFashion", label: "美妆 / 时尚" },
              { value: "other", label: "其他" },
            ],
          },
          {
            id: "mainGoalsOther",
            kind: "text",
            label: "其他",
            placeholder: "请填写",
            showWhen: (answers) =>
              Array.isArray(answers.mainGoals) && answers.mainGoals.includes("other"),
          },
        ],
      },
      {
        id: "travelType",
        title: "旅行类型",
        description: "您的旅行风格更偏向哪种？",
        fields: [
          {
            id: "scheduleFeel",
            kind: "single",
            label: "您希望旅行节奏是？ *",
            required: true,
            options: [
              { value: "relaxed", label: "轻松（每天 1-2 个行程）" },
              { value: "balanced", label: "适中（每天 3-4 个）" },
              { value: "packed", label: "紧凑（尽可能多）" },
            ],
          },
          {
            id: "planningStyle",
            kind: "single",
            label: "您的旅行规划风格是？ *",
            required: true,
            options: [
              { value: "fullyPlanned", label: "详细计划型" },
              { value: "semiPlanned", label: "大致规划型" },
              { value: "spontaneous", label: "随性即兴型" },
            ],
          },
          {
            id: "budgetLevel",
            kind: "single",
            label: "预算 *",
            required: true,
            options: [
              { value: "tight", label: "经济型" },
              { value: "standard", label: "普通" },
              { value: "premium", label: "高端" },
              { value: "luxury", label: "奢华" },
            ],
          },
          {
            id: "preferenceRanking",
            kind: "textarea",
            label: "偏好排序（请按重要性排序） *",
            placeholder: "例如：1. 美食 2. 购物 3. 文化",
            required: true,
          },
          {
            id: "mustDo",
            kind: "textarea",
            label: "这次旅行中，你一定要做的事情是什么？ *",
            placeholder: "请填写这次旅行一定要做的事情。",
            required: true,
          },
          {
            id: "avoidDuringTrip",
            kind: "textarea",
            label: "这次旅行中，你想要避免的事情是什么？ *",
            placeholder: "请填写这次旅行想避免的事情。",
            required: true,
          },
        ],
      },
    ],
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
            type="date"
            value={fieldValue?.start ?? ""}
          />
        </label>
        <label className="survey-subfield">
          <span>{content.departureLabel}</span>
          <input
            className="survey-input"
            onChange={(event) => onTextChange(field.endId, event.target.value)}
            type="date"
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
  const [language, setLanguage] = useState(normalizeSiteLanguage(initialLanguage));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setLanguage(normalizeSiteLanguage(initialLanguage));
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
    const normalizedLanguage = normalizeSiteLanguage(nextLanguage);
    setLanguage(normalizedLanguage);
    router.replace(`${pathname}?lang=${normalizedLanguage}`, { scroll: false });
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
      { label: content.summaryItems[0].label, value: fullName },
      { label: content.summaryItems[1].label, value: contactEmail },
      {
        label: content.summaryProfileLabel,
        value: joinSummaryValues(
          [age, gender, mbti],
          content.summaryFallback,
        ),
      },
      { label: content.summaryItems[2].label, value: destination },
      { label: content.summaryItems[3].label, value: travelDates },
      { label: content.summaryWithLabel, value: travelCompanion },
      { label: content.summaryItems[4].label, value: mainGoals },
      {
        label: content.summaryStyleLabel,
        value: joinSummaryValues(
          [scheduleFeel, planningStyle],
          content.summaryFallback,
        ),
      },
      { label: content.summaryBudgetLabel, value: budgetLevel },
      { label: content.summaryPreferenceLabel, value: preferenceRanking },
      { label: content.summaryMustDoLabel, value: mustDo },
      { label: content.summaryAvoidLabel, value: avoidDuringTrip },
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
            한국어
          </button>
          <button
            className={language === "zh" ? "lang-chip active" : "lang-chip"}
            onClick={() => handleLanguageChange("zh")}
            type="button"
          >
            中文
          </button>
          <button
            className={language === "en" ? "lang-chip active" : "lang-chip"}
            onClick={() => handleLanguageChange("en")}
            type="button"
          >
            English
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
