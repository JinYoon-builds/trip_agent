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

const surveyContent = {
  ko: {
    brand: "tripagent",
    back: "랜딩으로 돌아가기",
    title: "여행 성향 설문",
    subtitle: "당신의 여행 목적, 취향, 예산, 동행 구성에 맞는 프라이빗 가이드를 연결하기 위한 질문입니다.",
    sidebarKicker: "Travel Planner",
    sidebarTitle: "설문 진행 상황",
    sidebarText: "질문은 5단계로 구성되어 있습니다. 현재 단계와 입력한 여행 프로필을 왼쪽에서 바로 확인할 수 있습니다.",
    progressLabel: "진행률",
    summaryTitle: "여행 프로필 요약",
    summaryFallback: "미정",
    summaryContactLabel: "연락처 이메일",
    summaryDatesLabel: "여행 기간",
    summaryCompanionLabel: "동행 구성",
    summaryStyleLabel: "여행 스타일",
    summaryItems: [
      { label: "목적지", fieldId: "destination" },
      { label: "연락처", fieldId: "contactEmail" },
      { label: "동행", fieldId: "companionType" },
      { label: "예산", fieldId: "dailyBudget" },
      { label: "핵심 관심사", fieldId: "travelPurpose", extraFieldId: "travelPurposeCustom" },
    ],
    cardKicker: "Current Step",
    cardPill: "Question Form",
    previous: "이전",
    next: "다음 단계",
    finish: "설문 완료",
    submitting: "저장 중...",
    submitError:
      "임시 저장 중 문제가 발생했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.",
    emailRequiredError: "연락받을 이메일 주소를 올바르게 입력해 주세요.",
    selectionCount: "선택",
    maxSelectionText: (count) => `최대 ${count}개까지 선택 가능`,
    arrivalLabel: "도착 일시",
    departureLabel: "출발 일시",
    destinationSuggestions: ["서울", "부산", "제주", "인천", "경주", "강릉", "여수", "전주"],
    steps: [
      {
        id: "basic",
        title: "기본 정보",
        description: "필수 최소 입력 항목입니다. 목적지와 일정, 동행 구성을 먼저 파악합니다.",
        fields: [
          {
            id: "destination",
            kind: "text",
            label: "여행 목적지는 어디인가요?",
            placeholder: "도시 / 지역 선택",
            suggestionsKey: "destinationSuggestions",
          },
          {
            id: "contactEmail",
            kind: "text",
            inputType: "email",
            label: "연락받을 이메일 주소를 입력해 주세요",
            placeholder: "name@example.com",
          },
          {
            id: "travelDates",
            kind: "datetimeRange",
            label: "여행 기간은 어떻게 되나요?",
            startId: "arrivalDateTime",
            endId: "departureDateTime",
          },
          {
            id: "partySize",
            kind: "number",
            label: "동행 인원은 몇 명인가요?",
            placeholder: "예: 2",
          },
          {
            id: "companionType",
            kind: "single",
            label: "누구와 함께 여행하시나요?",
            options: [
              { value: "solo", label: "혼자" },
              { value: "friends", label: "친구" },
              { value: "couple", label: "연인" },
              { value: "family", label: "가족" },
              { value: "business", label: "비즈니스" },
            ],
          },
        ],
      },
      {
        id: "purpose",
        title: "여행 목적",
        description: "이번 여행에서 가장 기대하는 경험과 일정 스타일을 정리합니다.",
        fields: [
          {
            id: "travelPurpose",
            kind: "multi",
            label: "이번 여행의 주요 목적은 무엇인가요?",
            options: [
              { value: "healing", label: "힐링 / 휴식" },
              { value: "shopping", label: "쇼핑" },
              { value: "food", label: "맛집 탐방" },
              { value: "cafe", label: "카페 / 감성 공간" },
              { value: "landmark", label: "관광 / 랜드마크" },
              { value: "history", label: "역사 / 문화" },
              { value: "kcontent", label: "K-pop / K-drama 체험" },
              { value: "nature", label: "자연 / 풍경" },
              { value: "activity", label: "액티비티 / 체험" },
              { value: "beauty", label: "뷰티" },
              { value: "procedure", label: "성형/시술" },
              { value: "custom", label: "직접 입력" },
            ],
            maxSelections: 3,
          },
          {
            id: "travelPurposeCustom",
            kind: "text",
            label: "직접 입력이 있다면 적어주세요",
            placeholder: "예: 웨딩 스냅, 병원 상담, 공연 관람",
            showWhen: (answers) =>
              Array.isArray(answers.travelPurpose) && answers.travelPurpose.includes("custom"),
          },
          {
            id: "scheduleDensity",
            kind: "single",
            label: "어떤 여행 스타일을 선호하시나요?",
            options: [
              { value: "relaxed", label: "매우 여유롭게 (하루 1~2개 일정)" },
              { value: "balanced", label: "적당히 (하루 3~4개)" },
              { value: "packed", label: "빡빡하게 (최대한 많이)" },
            ],
          },
          {
            id: "planningFreedom",
            kind: "single",
            label: "여행 중 어느 정도 계획을 원하시나요?",
            options: [
              { value: "fullyPlanned", label: "완전 계획형 (시간 단위 일정)" },
              { value: "halfPlanned", label: "반반 (큰 틀만 계획)" },
              { value: "spontaneous", label: "즉흥형 (현장에서 결정)" },
            ],
          },
        ],
      },
      {
        id: "budget",
        title: "소비 성향",
        description: "예산 레벨과 돈을 가장 많이 쓰고 싶은 영역을 확인합니다.",
        fields: [
          {
            id: "dailyBudget",
            kind: "single",
            label: "1일 평균 여행 예산은 어느 정도인가요?",
            options: [
              { value: "budget", label: "저예산" },
              { value: "mid", label: "중간" },
              { value: "premium", label: "고급" },
              { value: "luxury", label: "럭셔리" },
            ],
          },
          {
            id: "spendingPriority",
            kind: "multi",
            label: "어떤 곳에 돈을 가장 많이 쓰고 싶으신가요?",
            options: [
              { value: "shopping", label: "쇼핑" },
              { value: "food", label: "음식" },
              { value: "stay", label: "숙소" },
              { value: "experience", label: "체험 / 액티비티" },
              { value: "cafe", label: "카페 / 감성 공간" },
            ],
            maxSelections: 2,
          },
        ],
      },
      {
        id: "interest",
        title: "관심사 / 취향",
        description: "사진, 카페, 쇼핑, 음식 취향을 세부적으로 파악합니다.",
        fields: [
          {
            id: "photoPreference",
            kind: "single",
            label: "사진 찍기 좋은 장소를 얼마나 중요하게 생각하시나요?",
            options: [
              { value: "veryImportant", label: "매우 중요" },
              { value: "normal", label: "보통" },
              { value: "notImportant", label: "중요하지 않음" },
            ],
          },
          {
            id: "trendCafePreference",
            kind: "single",
            label: "트렌디한 카페나 핫플 방문을 원하시나요?",
            options: [
              { value: "veryWant", label: "매우 원함" },
              { value: "normal", label: "보통" },
              { value: "notInterested", label: "관심 없음" },
            ],
          },
          {
            id: "shoppingStyle",
            kind: "single",
            label: "어떤 쇼핑을 선호하시나요?",
            options: [
              { value: "luxuryBrand", label: "명품 / 브랜드" },
              { value: "localDesigner", label: "로컬 브랜드 / 디자이너" },
              { value: "oliveYoungBeauty", label: "올리브영 / 뷰티" },
              { value: "dutyFree", label: "면세점" },
              { value: "none", label: "관심 없음" },
            ],
          },
          {
            id: "foodPreference",
            kind: "multi",
            label: "음식 취향을 선택해주세요",
            options: [
              { value: "korean", label: "한식" },
              { value: "streetFood", label: "길거리 음식" },
              { value: "fineDining", label: "고급 레스토랑" },
              { value: "cafeDessert", label: "카페 디저트" },
            ],
          },
          {
            id: "spicyTolerance",
            kind: "single",
            label: "매운 음식은 가능하신가요?",
            options: [
              { value: "spicyOk", label: "가능" },
              { value: "spicyNo", label: "불가" },
            ],
          },
          {
            id: "foodAvoidance",
            kind: "textarea",
            label: "피하고 싶은 음식이나 알러지가 있나요?",
            placeholder: "예: 갑각류 알러지, 고수 불호",
          },
        ],
      },
      {
        id: "personality",
        title: "여행 MBTI",
        description: "성격 기반 여행 스타일과 꼭 원하는 경험 / 피하고 싶은 경험을 정리합니다.",
        fields: [
          {
            id: "experienceStyle",
            kind: "single",
            label: "새로운 경험 vs 검증된 장소",
            options: [
              { value: "newChallenge", label: "새로운 곳 도전" },
              { value: "famousPreference", label: "유명한 곳 선호" },
            ],
          },
          {
            id: "crowdPreference",
            kind: "single",
            label: "사람 많은 곳 vs 한적한 곳",
            options: [
              { value: "hotplace", label: "북적이는 핫플" },
              { value: "quiet", label: "조용한 곳" },
            ],
          },
          {
            id: "planChange",
            kind: "single",
            label: "계획 변경 가능성",
            options: [
              { value: "keepPlan", label: "계획 그대로" },
              { value: "changeIfNeeded", label: "상황에 따라 변경" },
            ],
          },
          {
            id: "mustHave",
            kind: "textarea",
            label: "이번 여행에서 “절대 놓치고 싶지 않은 것” 1가지는?",
            placeholder: "예: K-pop 체험, 성수 핫플, 북촌 한옥마을",
          },
          {
            id: "avoidExperience",
            kind: "textarea",
            label: "이번 여행에서 “피하고 싶은 경험”은?",
            placeholder: "예: 긴 웨이팅, 과도한 이동, 복잡한 동선",
          },
        ],
      },
    ],
  },
  zh: {
    brand: "tripagent",
    back: "返回落地页",
    title: "旅行偏好问卷",
    subtitle: "这些问题用于理解你的旅行目的、偏好、预算与同行方式，以便匹配最合适的私人向导。",
    sidebarKicker: "Travel Planner",
    sidebarTitle: "问卷进度",
    sidebarText: "问卷共 5 个步骤。左侧会显示当前进度以及已经形成的旅行画像摘要。",
    progressLabel: "进度",
    summaryTitle: "旅行画像摘要",
    summaryFallback: "待填写",
    summaryContactLabel: "联系邮箱",
    summaryDatesLabel: "旅行期间",
    summaryCompanionLabel: "同行构成",
    summaryStyleLabel: "旅行风格",
    summaryItems: [
      { label: "目的地", fieldId: "destination" },
      { label: "联系邮箱", fieldId: "contactEmail" },
      { label: "同行", fieldId: "companionType" },
      { label: "预算", fieldId: "dailyBudget" },
      { label: "核心兴趣", fieldId: "travelPurpose", extraFieldId: "travelPurposeCustom" },
    ],
    cardKicker: "Current Step",
    cardPill: "Question Form",
    previous: "上一步",
    next: "下一步",
    finish: "完成问卷",
    submitting: "保存中...",
    submitError:
      "临时保存时发生问题。请检查浏览器本地存储是否可用，然后重试。",
    emailRequiredError: "请输入正确的联系邮箱地址。",
    selectionCount: "已选",
    maxSelectionText: (count) => `最多可选择 ${count} 项`,
    arrivalLabel: "到达时间",
    departureLabel: "离开时间",
    destinationSuggestions: ["首尔", "釜山", "济州", "仁川", "庆州", "江陵", "丽水", "全州"],
    steps: [
      {
        id: "basic",
        title: "基本信息",
        description: "先确认最基本的行程信息，包括目的地、时间和同行构成。",
        fields: [
          {
            id: "destination",
            kind: "text",
            label: "旅行目的地是哪里？",
            placeholder: "城市 / 地区选择",
            suggestionsKey: "destinationSuggestions",
          },
          {
            id: "contactEmail",
            kind: "text",
            inputType: "email",
            label: "请输入可联系到你的邮箱地址",
            placeholder: "name@example.com",
          },
          {
            id: "travelDates",
            kind: "datetimeRange",
            label: "旅行期间是怎样安排的？",
            startId: "arrivalDateTime",
            endId: "departureDateTime",
          },
          {
            id: "partySize",
            kind: "number",
            label: "同行人数是多少？",
            placeholder: "例如：2",
          },
          {
            id: "companionType",
            kind: "single",
            label: "你会和谁一起旅行？",
            options: [
              { value: "solo", label: "独自" },
              { value: "friends", label: "朋友" },
              { value: "couple", label: "情侣" },
              { value: "family", label: "家人" },
              { value: "business", label: "商务" },
            ],
          },
        ],
      },
      {
        id: "purpose",
        title: "旅行目的",
        description: "整理这次旅行最想实现的体验，以及行程节奏与规划偏好。",
        fields: [
          {
            id: "travelPurpose",
            kind: "multi",
            label: "这次旅行的主要目的是什么？",
            options: [
              { value: "healing", label: "疗愈 / 休息" },
              { value: "shopping", label: "购物" },
              { value: "food", label: "美食探店" },
              { value: "cafe", label: "咖啡 / 氛围空间" },
              { value: "landmark", label: "观光 / 地标" },
              { value: "history", label: "历史 / 文化" },
              { value: "kcontent", label: "K-pop / 韩剧体验" },
              { value: "nature", label: "自然 / 风景" },
              { value: "activity", label: "活动 / 体验" },
              { value: "beauty", label: "美容" },
              { value: "procedure", label: "整形 / 项目" },
              { value: "custom", label: "直接输入" },
            ],
            maxSelections: 3,
          },
          {
            id: "travelPurposeCustom",
            kind: "text",
            label: "如果有其他目的，请直接填写",
            placeholder: "例如：婚纱拍摄、医院咨询、看演出",
            showWhen: (answers) =>
              Array.isArray(answers.travelPurpose) && answers.travelPurpose.includes("custom"),
          },
          {
            id: "scheduleDensity",
            kind: "single",
            label: "你偏好的旅行节奏是？",
            options: [
              { value: "relaxed", label: "非常轻松（每天 1~2 个安排）" },
              { value: "balanced", label: "适中（每天 3~4 个安排）" },
              { value: "packed", label: "紧凑（尽量安排更多）" },
            ],
          },
          {
            id: "planningFreedom",
            kind: "single",
            label: "旅行中希望有多高的计划程度？",
            options: [
              { value: "fullyPlanned", label: "完全计划型（按小时安排）" },
              { value: "halfPlanned", label: "一半一半（只规划大框架）" },
              { value: "spontaneous", label: "偏即兴（现场决定）" },
            ],
          },
        ],
      },
      {
        id: "budget",
        title: "消费倾向",
        description: "确认每日预算等级，以及最愿意重点消费的项目。",
        fields: [
          {
            id: "dailyBudget",
            kind: "single",
            label: "每天的平均旅行预算大概是多少？",
            options: [
              { value: "budget", label: "低预算" },
              { value: "mid", label: "中等" },
              { value: "premium", label: "高端" },
              { value: "luxury", label: "奢华" },
            ],
          },
          {
            id: "spendingPriority",
            kind: "multi",
            label: "你最想把钱花在哪些地方？",
            options: [
              { value: "shopping", label: "购物" },
              { value: "food", label: "餐饮" },
              { value: "stay", label: "住宿" },
              { value: "experience", label: "体验 / 活动" },
              { value: "cafe", label: "咖啡 / 氛围空间" },
            ],
            maxSelections: 2,
          },
        ],
      },
      {
        id: "interest",
        title: "兴趣 / 偏好",
        description: "了解你对拍照、咖啡、购物与饮食方面的具体偏好。",
        fields: [
          {
            id: "photoPreference",
            kind: "single",
            label: "你有多重视适合拍照的地点？",
            options: [
              { value: "veryImportant", label: "非常重要" },
              { value: "normal", label: "一般" },
              { value: "notImportant", label: "不重要" },
            ],
          },
          {
            id: "trendCafePreference",
            kind: "single",
            label: "你想去潮流咖啡馆或热门打卡地吗？",
            options: [
              { value: "veryWant", label: "非常想去" },
              { value: "normal", label: "一般" },
              { value: "notInterested", label: "没兴趣" },
            ],
          },
          {
            id: "shoppingStyle",
            kind: "single",
            label: "你偏好的购物类型是什么？",
            options: [
              { value: "luxuryBrand", label: "奢侈品 / 品牌" },
              { value: "localDesigner", label: "本地品牌 / 设计师" },
              { value: "oliveYoungBeauty", label: "Olive Young / 美妆" },
              { value: "dutyFree", label: "免税店" },
              { value: "none", label: "没兴趣" },
            ],
          },
          {
            id: "foodPreference",
            kind: "multi",
            label: "请选择你的饮食偏好",
            options: [
              { value: "korean", label: "韩餐" },
              { value: "streetFood", label: "街头小吃" },
              { value: "fineDining", label: "高级餐厅" },
              { value: "cafeDessert", label: "咖啡甜点" },
            ],
          },
          {
            id: "spicyTolerance",
            kind: "single",
            label: "你能吃辣吗？",
            options: [
              { value: "spicyOk", label: "可以" },
              { value: "spicyNo", label: "不可以" },
            ],
          },
          {
            id: "foodAvoidance",
            kind: "textarea",
            label: "有没有想避开的食物或过敏情况？",
            placeholder: "例如：甲壳类过敏、不吃香菜",
          },
        ],
      },
      {
        id: "personality",
        title: "旅行 MBTI",
        description: "最后用几道性格问题确认你的旅行风格与想避开的体验。",
        fields: [
          {
            id: "experienceStyle",
            kind: "single",
            label: "新的体验 vs 已验证的地点",
            options: [
              { value: "newChallenge", label: "挑战新地方" },
              { value: "famousPreference", label: "更偏爱知名地点" },
            ],
          },
          {
            id: "crowdPreference",
            kind: "single",
            label: "热闹人多 vs 安静悠闲",
            options: [
              { value: "hotplace", label: "热闹热门地" },
              { value: "quiet", label: "安静的地方" },
            ],
          },
          {
            id: "planChange",
            kind: "single",
            label: "计划变更可能性",
            options: [
              { value: "keepPlan", label: "按原计划进行" },
              { value: "changeIfNeeded", label: "根据情况调整" },
            ],
          },
          {
            id: "mustHave",
            kind: "textarea",
            label: "这次旅行中“绝对不想错过”的一件事是什么？",
            placeholder: "例如：K-pop 体验、圣水热门店、北村韩屋村",
          },
          {
            id: "avoidExperience",
            kind: "textarea",
            label: "这次旅行中“最想避免”的体验是什么？",
            placeholder: "例如：长时间排队、移动太多、动线复杂",
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
    const companionType = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("companionType"),
    });
    const partySize =
      typeof answers.partySize === "string" && answers.partySize.trim()
        ? `${answers.partySize.trim()}${language === "zh" ? " 人" : "명"}`
        : "";
    const budget = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("dailyBudget"),
    });
    const purpose = formatSummaryValue({
      answers,
      extraFieldId: "travelPurposeCustom",
      fallback: content.summaryFallback,
      field: fieldMap.get("travelPurpose"),
    });
    const scheduleDensity = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("scheduleDensity"),
    });
    const planningFreedom = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("planningFreedom"),
    });

    return [
      { label: content.summaryItems[0].label, value: destination },
      { label: content.summaryContactLabel, value: contactEmail },
      {
        label: content.summaryCompanionLabel,
        value: joinSummaryValues(
          [companionType, partySize],
          content.summaryFallback,
        ),
      },
      { label: content.summaryDatesLabel, value: travelDates },
      { label: content.summaryItems[3].label, value: budget },
      { label: content.summaryItems[4].label, value: purpose },
      {
        label: content.summaryStyleLabel,
        value: joinSummaryValues(
          [scheduleDensity, planningFreedom],
          content.summaryFallback,
        ),
      },
    ];
  };

  const handleSubmit = async () => {
    const contactEmail =
      typeof answers.contactEmail === "string" ? answers.contactEmail.trim() : "";

    if (!isValidEmail(contactEmail)) {
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
