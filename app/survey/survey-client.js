"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import AuthButtons from "../../components/auth-buttons";
import { useAuth } from "../../components/auth-provider";
import { trackEvent } from "../../lib/analytics";
import { normalizeSiteLanguage } from "../../lib/language";
import { getPaymentMethodForLanguage } from "../../lib/payment";
import {
  formatDailyRateDisplayLabel,
  formatPaymentDisplayLabel,
  getGuideDatesFromAnswers,
  getGuideDayCountFromAnswers,
  getGuidePricingQuote,
} from "../../lib/pricing";
import {
  createSurveySubmissionId,
  saveSurveySubmission,
} from "../../lib/survey-local-storage";
import {
  createRemoteSubmission,
  fetchRemoteSubmission,
  updateRemoteSubmission,
} from "../../lib/submission-client";
const LANGUAGE_LOCALES = {
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
};

const DAILY_BUDGET_CURRENCY_BY_LANGUAGE = {
  en: "USD",
  ko: "USD",
  zh: "CNY",
};

const SURVEY_ANALYTICS_ID = "guide_matching_v1";
const surveyModeCopy = {
  en: {
    editBack: "Back to my page",
    editTitle: "Update your travel request",
    editSubtitle:
      "Review the saved survey and update the full form before payment is completed.",
    editSidebarText:
      "This uses the same survey form, but saving will update the existing request instead of creating a new one.",
    editFinish: "Save changes",
    editSubmitting: "Saving changes...",
    editSubmitError: "We could not save your changes just now. Please try again.",
    editLoading: "Loading your saved survey...",
    editLoadError:
      "We could not load this saved survey. Please return to your my page and try again.",
    editLockedError:
      "This submission can no longer be edited because payment has already been completed.",
  },
  ko: {
    editBack: "마이페이지로 돌아가기",
    editTitle: "저장된 여행 요청 수정",
    editSubtitle:
      "결제가 완료되기 전까지 저장된 설문 전체를 다시 확인하고 수정할 수 있습니다.",
    editSidebarText:
      "같은 설문 폼을 사용하지만, 저장 시 새 제출이 아니라 기존 요청을 업데이트합니다.",
    editFinish: "수정 저장",
    editSubmitting: "수정 내용을 저장하는 중...",
    editSubmitError: "설문 수정 내용을 저장하지 못했습니다. 다시 시도해 주세요.",
    editLoading: "저장된 설문을 불러오는 중입니다...",
    editLoadError:
      "저장된 설문을 불러오지 못했습니다. 마이페이지로 돌아가 다시 시도해 주세요.",
    editLockedError:
      "이미 결제 완료된 제출이라 더 이상 수정할 수 없습니다.",
  },
  zh: {
    editBack: "返回我的页面",
    editTitle: "修改已保存的旅行请求",
    editSubtitle:
      "在付款完成前，你可以重新查看并修改整份已保存的问卷。",
    editSidebarText:
      "这里仍然使用同一份问卷表单，但保存时会更新原有请求，而不是创建新提交。",
    editFinish: "保存修改",
    editSubmitting: "正在保存修改...",
    editSubmitError: "暂时无法保存你的修改，请重试。",
    editLoading: "正在加载你保存的问卷...",
    editLoadError: "无法加载这份已保存的问卷，请返回我的页面后重试。",
    editLockedError: "这份提交已经完成付款，不能再修改。",
  },
};

const surveyContent = {
  en: {
    brand: "刘Unnie",
    back: "Back to home",
    title: "All-in-one Travel Service",
    subtitle:
      "Travel made easy. From planning to the end, your trip is fully taken care of.",
    sidebarKicker: "Travel Service",
    sidebarTitle: "Survey Progress",
    sidebarText:
      "This survey has 2 pages. Fill in the key details so we can understand your trip clearly.",
    progressLabel: "Progress",
    summaryTitle: "Quick Summary",
    summaryFallback: "Not yet",
    summaryItems: [
      { label: "Name", fieldId: "fullName" },
      { label: "Contact Email", fieldId: "contactEmail" },
      { label: "Destination", fieldId: "destination" },
      { label: "Travel Dates", fieldId: "travelDates" },
      { label: "Main Goals", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
      { label: "Guide Days", fieldId: "guideDates" },
      { label: "Daily Budget", fieldId: "dailyBudget" },
    ],
    summaryProfileLabel: "Age / Gender / MBTI",
    summaryWithLabel: "Traveling With",
    summaryStyleLabel: "Travel Style",
    summaryBudgetLabel: "Daily Budget",
    summaryPreferenceLabel: "Preference Ranking",
    summaryMustDoLabel: "Must Do",
    summaryAvoidLabel: "Avoid",
    pricingTitle: "Guide Pricing",
    pricingEmpty: "Select at least one guide date to see the payment amount.",
    pricingGuideDaysLabel: "Guide Days",
    pricingDailyRateLabel: "Daily Rate",
    pricingTotalLabel: "Estimated Payment",
    inlineQuoteTitle: "Estimated Quote",
    pricingHint:
      "Only the dates you select for a guide will be charged at checkout.",
    pricingDailyRateValue: (amountLabel) => amountLabel,
    guidePricingNoticeTitle: "Guide Pricing Rules",
    guidePricingNoticeOneDay: (amountLabel) => `1 day: ${amountLabel}`,
    guidePricingNoticeTwoDays: (amountLabel) => `2 days: ${amountLabel}`,
    guidePricingNoticeThreeDays: (amountLabel) => `3+ days: ${amountLabel}`,
    guidePricingNoticeExample: (amountLabel) => `Example: 2 days = ${amountLabel} total`,
    guidePricingNoticeFootnote: "You only pay for the dates you select for a guide.",
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
    emailConfirmRequiredError:
      "Please confirm that this is the email where you want to receive your guide details.",
    selectionCount: "Selected",
    maxSelectionText: (count) => `Choose up to ${count}`,
    summaryWechatLabel: "WeChat ID",
    summaryPhoneLabel: "Phone Number",
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
            id: "contactEmailConfirmed",
            kind: "checkbox",
            label: "Email Confirmation *",
            checkboxText:
              "I confirmed this is the email where I want to receive my guide details.",
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
          {
            id: "wechatId",
            kind: "text",
            label: "WeChat ID (optional)",
            placeholder: "e.g. lieunnie88",
          },
          {
            id: "phoneNumber",
            kind: "text",
            inputType: "tel",
            label: "Phone Number (optional)",
            placeholder: "e.g. +82 10-1234-5678",
          },
        ],
      },
      {
        id: "travelDetails",
        title: "Travel Details",
        description: "Tell us about your trip details and approximate daily budget.",
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
            id: "guideDates",
            kind: "dateMulti",
            label: "Which dates do you want a guide for? *",
            required: true,
            showWhen: (answers) =>
              isValidDateRange(answers.travelStartDate, answers.travelEndDate),
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
          {
            id: "dailyBudget",
            kind: "range",
            label: "About how much is your daily budget? (in USD) *",
            hint: "Exact amount is not necessary. Move the bar to choose an approximate daily budget in USD.",
            unselectedText: "Move the bar to choose your daily budget in USD",
            initialValue: 200,
            min: 50,
            max: 1000,
            step: 50,
            required: true,
          },
        ],
      },
    ],
  },
  ko: {
    brand: "刘Unnie",
    back: "랜딩으로 돌아가기",
    title: "올인원 여행 서비스",
    subtitle:
      "여행 준비부터 마지막까지, 당신의 여행을 더 쉽게 만들어드립니다.",
    sidebarKicker: "여행 서비스",
    sidebarTitle: "설문 진행 상황",
    sidebarText:
      "설문은 2페이지로 구성되어 있습니다. 핵심 정보를 입력해 주시면 여행 성향을 더 정확히 이해할 수 있습니다.",
    progressLabel: "진행률",
    summaryTitle: "입력 요약",
    summaryFallback: "미입력",
    summaryItems: [
      { label: "이름", fieldId: "fullName" },
      { label: "이메일", fieldId: "contactEmail" },
      { label: "목적지", fieldId: "destination" },
      { label: "여행 기간", fieldId: "travelDates" },
      { label: "여행 목적", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
      { label: "가이드 필요 날짜", fieldId: "guideDates" },
      { label: "하루 예산", fieldId: "dailyBudget" },
    ],
    summaryProfileLabel: "나이 / 성별 / MBTI",
    summaryWithLabel: "동행",
    summaryStyleLabel: "여행 스타일",
    summaryBudgetLabel: "하루 예산",
    summaryPreferenceLabel: "선호 순위",
    summaryMustDoLabel: "꼭 하고 싶은 것",
    summaryAvoidLabel: "피하고 싶은 것",
    pricingTitle: "가이드 요금",
    pricingEmpty: "가이드가 필요한 날짜를 하나 이상 선택하면 결제 금액이 바로 표시됩니다.",
    pricingGuideDaysLabel: "선택 일수",
    pricingDailyRateLabel: "일일 요금",
    pricingTotalLabel: "예상 결제 금액",
    inlineQuoteTitle: "예상 견적",
    pricingHint:
      "체크아웃에서는 선택한 가이드 날짜에 대해서만 결제가 진행됩니다.",
    pricingDailyRateValue: (amountLabel) => amountLabel,
    guidePricingNoticeTitle: "가이드 요금 안내",
    guidePricingNoticeOneDay: (amountLabel) => `1일: ${amountLabel}`,
    guidePricingNoticeTwoDays: (amountLabel) => `2일: ${amountLabel}`,
    guidePricingNoticeThreeDays: (amountLabel) => `3일 이상: ${amountLabel}`,
    guidePricingNoticeExample: (amountLabel) => `예: 2일 선택 시 총 ${amountLabel}`,
    guidePricingNoticeFootnote: "가이드가 필요한 날짜에 대해서만 결제됩니다.",
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
    emailConfirmRequiredError:
      "가이드 안내를 받을 이메일이 맞는지 확인 체크를 해 주세요.",
    selectionCount: "선택",
    maxSelectionText: (count) => `최대 ${count}개 선택`,
    summaryWechatLabel: "WeChat ID",
    summaryPhoneLabel: "전화번호",
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
            id: "contactEmailConfirmed",
            kind: "checkbox",
            label: "이메일 확인 *",
            checkboxText:
              "가이드 안내를 받을 이메일이 맞는지 확인했습니다.",
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
          {
            id: "wechatId",
            kind: "text",
            label: "WeChat ID (선택)",
            placeholder: "예: lieunnie88",
          },
          {
            id: "phoneNumber",
            kind: "text",
            inputType: "tel",
            label: "전화번호 (선택)",
            placeholder: "예: 010-1234-5678",
          },
        ],
      },
      {
        id: "travelDetails",
        title: "여행 정보",
        description: "실제 여행 일정과 대략적인 하루 예산을 알려주세요.",
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
            id: "guideDates",
            kind: "dateMulti",
            label: "가이드가 필요한 날짜를 선택해 주세요 *",
            required: true,
            showWhen: (answers) =>
              isValidDateRange(answers.travelStartDate, answers.travelEndDate),
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
          {
            id: "dailyBudget",
            kind: "range",
            label: "하루 예산은 대략 얼마인가요? (USD 기준) *",
            hint: "정확하지 않아도 괜찮아요. 바를 움직여 대략적인 하루 예산을 달러 기준으로 선택해 주세요.",
            unselectedText: "바를 움직여 하루 예산을 선택해 주세요",
            initialValue: 200,
            min: 50,
            max: 1000,
            step: 50,
            required: true,
          },
        ],
      },
    ],
  },
  zh: {
    brand: "刘Unnie",
    back: "返回首页",
    title: "一站式旅行服务",
    subtitle:
      "让旅行更简单。从规划到结束，全程为您打理。",
    sidebarKicker: "旅行服务",
    sidebarTitle: "问卷进度",
    sidebarText:
      "问卷共 2 页。请填写关键信息，方便我们更准确地理解你的旅行需求。",
    progressLabel: "进度",
    summaryTitle: "快速摘要",
    summaryFallback: "待填写",
    summaryItems: [
      { label: "姓名", fieldId: "fullName" },
      { label: "联系邮箱", fieldId: "contactEmail" },
      { label: "目的地", fieldId: "destination" },
      { label: "旅行时间", fieldId: "travelDates" },
      { label: "旅行目的", fieldId: "mainGoals", extraFieldId: "mainGoalsOther" },
      { label: "需要向导的日期", fieldId: "guideDates" },
      { label: "每日预算", fieldId: "dailyBudget" },
    ],
    summaryProfileLabel: "年龄 / 性别 / MBTI",
    summaryWithLabel: "同行",
    summaryStyleLabel: "旅行风格",
    summaryBudgetLabel: "每日预算",
    summaryPreferenceLabel: "偏好排序",
    summaryMustDoLabel: "一定要做的事",
    summaryAvoidLabel: "想避免的事",
    pricingTitle: "向导费用",
    pricingEmpty: "先选择至少一天需要向导的日期，系统就会立即显示支付金额。",
    pricingGuideDaysLabel: "选择天数",
    pricingDailyRateLabel: "每日费用",
    pricingTotalLabel: "预计支付金额",
    inlineQuoteTitle: "预计报价",
    pricingHint:
      "结账时只会按你选择需要向导的日期收费。",
    pricingDailyRateValue: (amountLabel) => amountLabel,
    guidePricingNoticeTitle: "向导费用说明",
    guidePricingNoticeOneDay: (amountLabel) => `1 天：${amountLabel}`,
    guidePricingNoticeTwoDays: (amountLabel) => `2 天：${amountLabel}`,
    guidePricingNoticeThreeDays: (amountLabel) => `3 天及以上：${amountLabel}`,
    guidePricingNoticeExample: (amountLabel) => `例如：2 天共 ${amountLabel}`,
    guidePricingNoticeFootnote: "只会按你选择需要向导的日期收费。",
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
    emailConfirmRequiredError:
      "请先勾选确认这是接收向导联系的邮箱。",
    selectionCount: "已选",
    maxSelectionText: (count) => `最多选择 ${count} 项`,
    summaryWechatLabel: "WeChat ID",
    summaryPhoneLabel: "电话号码",
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
            id: "contactEmailConfirmed",
            kind: "checkbox",
            label: "邮箱确认 *",
            checkboxText:
              "我已确认这是接收向导联系的邮箱。",
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
          {
            id: "wechatId",
            kind: "text",
            label: "WeChat ID（选填）",
            placeholder: "例如：lieunnie88",
          },
          {
            id: "phoneNumber",
            kind: "text",
            inputType: "tel",
            label: "电话号码（选填）",
            placeholder: "例如：138 0000 0000",
          },
        ],
      },
      {
        id: "travelDetails",
        title: "旅游信息",
        description: "请告诉我们你的旅行信息和大致每日预算。",
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
            id: "guideDates",
            kind: "dateMulti",
            label: "请选择需要向导的日期 *",
            required: true,
            showWhen: (answers) =>
              isValidDateRange(answers.travelStartDate, answers.travelEndDate),
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
          {
            id: "dailyBudget",
            kind: "range",
            label: "你每天的预算大约是多少？（按人民币）*",
            hint: "不需要非常精确。拖动滑杆，选择一个按人民币计算的大致每日预算即可。",
            unselectedText: "拖动滑杆选择每日预算",
            initialValue: 800,
            min: 200,
            max: 3000,
            step: 100,
            required: true,
          },
        ],
      },
    ],
  },
};

function parseDateValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const [year, month, day] = value.split("-").map((item) => Number(item));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function isValidDateRange(startValue, endValue) {
  const startDate = parseDateValue(startValue);
  const endDate = parseDateValue(endValue);

  return Boolean(startDate && endDate && startDate <= endDate);
}

function getTravelDateValues(startValue, endValue) {
  const startDate = parseDateValue(startValue);
  const endDate = parseDateValue(endValue);

  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const values = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    values.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return values;
}

function formatTravelCalendarDate(value, language) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "";
  }

  const normalizedLanguage = normalizeSiteLanguage(language);
  const locale = LANGUAGE_LOCALES[normalizedLanguage] ?? LANGUAGE_LOCALES.en;

  return new Intl.DateTimeFormat(locale, {
    month: normalizedLanguage === "en" ? "short" : "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(parsedDate);
}

function buildGuideDateOptions(startValue, endValue, language) {
  return getTravelDateValues(startValue, endValue).map((value) => ({
    value,
    label: formatTravelCalendarDate(value, language),
  }));
}

function isFieldVisible(field, answers) {
  if (!field.showWhen) {
    return true;
  }

  return field.showWhen(answers);
}

function isFieldAnswered(field, answers) {
  if (field.kind === "multi" || field.kind === "dateMulti") {
    return Array.isArray(answers[field.id]) && answers[field.id].length > 0;
  }

  if (field.kind === "checkbox") {
    return answers[field.id] === true;
  }

  if (field.kind === "datetimeRange") {
    return isValidDateRange(answers[field.startId], answers[field.endId]);
  }

  if (field.kind === "range") {
    return Number.isFinite(Number(answers[field.id]));
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
  return typeof value === "string" && value.includes("T")
    ? value.replace("T", " ")
    : value;
}

function formatBudgetAmount(value, language) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  const normalizedLanguage = normalizeSiteLanguage(language);
  const locale = LANGUAGE_LOCALES[normalizedLanguage] ?? LANGUAGE_LOCALES.en;
  const currency =
    DAILY_BUDGET_CURRENCY_BY_LANGUAGE[normalizedLanguage] ??
    DAILY_BUDGET_CURRENCY_BY_LANGUAGE.en;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDailyBudgetValue(value, language) {
  const formattedValue = formatBudgetAmount(value, language);

  if (!formattedValue) {
    return "";
  }

  if (language === "ko") {
    return `약 ${formattedValue} / 일`;
  }

  if (language === "zh") {
    return `约 ${formattedValue} / 天`;
  }

  return `About ${formattedValue} / day`;
}

function formatSummaryValue({ field, answers, fallback, extraFieldId, language }) {
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

    return isValidDateRange(start, end)
      ? `${formatTravelCalendarDate(start, language)} - ${formatTravelCalendarDate(end, language)}`
      : fallback;
  }

  if (field.kind === "dateMulti") {
    const selectedValues = Array.isArray(answers[field.id]) ? answers[field.id] : [];
    const optionMap = new Map(
      buildGuideDateOptions(
        answers.travelStartDate,
        answers.travelEndDate,
        language,
      ).map((option) => [option.value, option.label]),
    );
    const labels = selectedValues
      .map((value) => optionMap.get(value))
      .filter((value) => typeof value === "string" && value.trim().length > 0);

    return labels.length > 0 ? labels.join(" · ") : fallback;
  }

  if (field.kind === "range") {
    return Number.isFinite(Number(answers[field.id]))
      ? formatDailyBudgetValue(answers[field.id], language)
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
  answers,
  content,
  field,
  fieldValue,
  language,
  onCheckboxChange,
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

  if (field.kind === "dateMulti") {
    const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];
    const dateOptions = buildGuideDateOptions(
      answers.travelStartDate,
      answers.travelEndDate,
      language,
    );

    return (
      <>
        <div className="survey-field-meta">
          <span>&nbsp;</span>
          <strong>
            {content.selectionCount} {selectedValues.length}
          </strong>
        </div>

        <div className="survey-chip-grid">
          {dateOptions.map((option) => {
            const active = selectedValues.includes(option.value);

            return (
              <button
                aria-pressed={active}
                className={active ? "survey-chip-button active" : "survey-chip-button"}
                key={option.value}
                onClick={() => onMultiToggle(field.id, option.value)}
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

  if (field.kind === "range") {
    const hasSelectedValue = Number.isFinite(Number(fieldValue));
    const numericValue = hasSelectedValue ? Number(fieldValue) : field.initialValue;
    const progress = ((numericValue - field.min) / (field.max - field.min)) * 100;

    return (
      <div className="survey-slider-shell">
        <div
          className={
            hasSelectedValue
              ? "survey-slider-value"
              : "survey-slider-value survey-slider-value-placeholder"
          }
        >
          <strong>
            {hasSelectedValue
              ? formatDailyBudgetValue(numericValue, language)
              : field.unselectedText}
          </strong>
          <span>{field.hint}</span>
        </div>

        <div className="survey-slider-control">
          <div className="survey-slider-track" />
          <div
            className="survey-slider-track-fill"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
          <input
            aria-label={field.label}
            aria-valuetext={formatDailyBudgetValue(numericValue, language)}
            className="survey-slider-input"
            max={field.max}
            min={field.min}
            onChange={(event) => onTextChange(field.id, event.target.value)}
            step={field.step}
            type="range"
            value={numericValue}
          />
        </div>

        <div className="survey-slider-scale">
          <span>{formatBudgetAmount(field.min, language)}</span>
          <span>{`${formatBudgetAmount(field.max, language)}+`}</span>
        </div>
      </div>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <label className="survey-checkbox-field">
        <input
          checked={fieldValue === true}
          className="survey-checkbox-input"
          onChange={(event) => onCheckboxChange(field.id, event.target.checked)}
          type="checkbox"
        />
        <span>{field.checkboxText}</span>
      </label>
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

export default function SurveyClient({
  initialLanguage,
  mode = "create",
  submissionId = "",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isEmailVerified, openAuthModal, status } = useAuth();
  const [language, setLanguage] = useState(normalizeSiteLanguage(initialLanguage));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSubmitLoginGate, setShowSubmitLoginGate] = useState(false);
  const [isLoadingExistingSubmission, setIsLoadingExistingSubmission] = useState(
    mode === "edit",
  );
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [editLoadError, setEditLoadError] = useState("");
  const trackedFieldStartsRef = useRef(new Set());
  const lastDateRangeKeyRef = useRef("");
  const lastStepViewKeyRef = useRef("");
  const lastInteractionRef = useRef(null);
  const hasStartedRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const hasTrackedAbandonRef = useRef(false);
  const abandonContextRef = useRef(null);
  const submitAfterAuthRef = useRef(false);

  useEffect(() => {
    setLanguage(normalizeSiteLanguage(initialLanguage));
  }, [initialLanguage]);

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    if (status !== "ready") {
      return;
    }

    if (!isAuthenticated) {
      openAuthModal("signIn", "general");
      setIsLoadingExistingSubmission(false);
      setEditLoadError(surveyModeCopy[language].editLoadError);
      return;
    }

    if (!submissionId) {
      setIsLoadingExistingSubmission(false);
      setEditLoadError(surveyModeCopy[language].editLoadError);
      return;
    }

    let cancelled = false;

    const loadSubmission = async () => {
      setIsLoadingExistingSubmission(true);
      setEditLoadError("");

      try {
        const submission = await fetchRemoteSubmission(submissionId);

        if (cancelled) {
          return;
        }

        if (!submission?.id) {
          throw new Error(surveyModeCopy[language].editLoadError);
        }

        if (!submission.isEditable) {
          setEditLoadError(surveyModeCopy[language].editLockedError);
          setExistingSubmission(submission);
          setAnswers(submission.answers ?? {});
          return;
        }

        setExistingSubmission(submission);
        setAnswers(submission.answers ?? {});
      } catch (error) {
        if (!cancelled) {
          setEditLoadError(error?.message || surveyModeCopy[language].editLoadError);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExistingSubmission(false);
        }
      }
    };

    void loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, language, mode, openAuthModal, status, submissionId]);

  useEffect(() => {
    setAnswers((prev) => {
      const selectedGuideDates = Array.isArray(prev.guideDates) ? prev.guideDates : [];

      if (selectedGuideDates.length === 0) {
        return prev;
      }

      const validDateSet = new Set(
        getTravelDateValues(prev.travelStartDate, prev.travelEndDate),
      );
      const nextGuideDates = selectedGuideDates.filter((value) => validDateSet.has(value));

      if (
        nextGuideDates.length === selectedGuideDates.length &&
        nextGuideDates.every((value, index) => value === selectedGuideDates[index])
      ) {
        return prev;
      }

      return {
        ...prev,
        guideDates: nextGuideDates,
      };
    });
  }, [answers.travelStartDate, answers.travelEndDate]);

  const content = surveyContent[language];
  const modeContent = surveyModeCopy[language];
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
  const analyticsFieldMap = useMemo(() => {
    const map = new Map();

    steps.forEach((step, stepIndex) => {
      step.fields.forEach((field) => {
        const meta = {
          field,
          step,
          stepIndex,
        };

        if (field.id) {
          map.set(field.id, meta);
        }

        if (field.startId) {
          map.set(field.startId, {
            ...meta,
            inputTarget: "start",
          });
        }

        if (field.endId) {
          map.set(field.endId, {
            ...meta,
            inputTarget: "end",
          });
        }
      });
    });

    return map;
  }, [steps]);
  const currentStepId = currentStep?.id ?? "";
  const selectedGuideDates = getGuideDatesFromAnswers(answers);
  const selectedGuideDayCount = selectedGuideDates.length;
  const livePricingQuote =
    selectedGuideDayCount > 0
      ? getGuidePricingQuote({
          guideDayCount: selectedGuideDayCount,
          language,
        })
      : null;
  const oneDayPricingQuote = getGuidePricingQuote({ guideDayCount: 1, language });
  const twoDayPricingQuote = getGuidePricingQuote({ guideDayCount: 2, language });
  const livePaymentDisplayLabel = livePricingQuote
    ? formatPaymentDisplayLabel({
        amount: livePricingQuote.totalAmount,
        currency: livePricingQuote.currency,
        language,
      })
    : "";
  const oneDayDailyRateLabel = formatDailyRateDisplayLabel({
    amount: oneDayPricingQuote.dailyRate,
    currency: oneDayPricingQuote.currency,
    language,
  });
  const twoDayPricingLabel = formatPaymentDisplayLabel({
    amount: twoDayPricingQuote.totalAmount,
    currency: twoDayPricingQuote.currency,
    language,
  });
  const twoDayDailyRateLabel = formatDailyRateDisplayLabel({
    amount: twoDayPricingQuote.dailyRate,
    currency: twoDayPricingQuote.currency,
    language,
  });
  const threeDayPricingQuote = getGuidePricingQuote({ guideDayCount: 3, language });
  const threeDayDailyRateLabel = formatDailyRateDisplayLabel({
    amount: threeDayPricingQuote.dailyRate,
    currency: threeDayPricingQuote.currency,
    language,
  });
  const liveDailyRateLabel = livePricingQuote
    ? formatDailyRateDisplayLabel({
        amount: livePricingQuote.dailyRate,
        currency: livePricingQuote.currency,
        language,
      })
    : "";

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    const stepViewKey = `${language}:${currentStep.id}:${currentStepIndex}`;

    if (lastStepViewKeyRef.current === stepViewKey) {
      return;
    }

    lastStepViewKeyRef.current = stepViewKey;

    if (currentStepIndex > 0) {
      hasStartedRef.current = true;
    }

    trackEvent("survey_step_view", {
      survey_id: SURVEY_ANALYTICS_ID,
      language,
      step_id: currentStep.id,
      step_number: currentStepIndex + 1,
      visible_field_count: visibleFields.length,
      answered_field_count: answeredCurrentStep,
    });
  }, [
    answeredCurrentStep,
    currentStep,
    currentStepId,
    currentStepIndex,
    language,
    visibleFields.length,
  ]);

  useEffect(() => {
    abandonContextRef.current = {
      answeredFieldCount: answeredOverall,
      currentStepId,
      currentStepNumber: currentStepIndex + 1,
      hasStarted: hasStartedRef.current || answeredOverall > 0 || currentStepIndex > 0,
      hasSubmitted: hasSubmittedRef.current,
      lastInteraction: lastInteractionRef.current,
      language,
      totalFieldCount: totalFields,
      visibleFieldCount: visibleFields.length,
    };
  }, [
    answeredOverall,
    currentStepId,
    currentStepIndex,
    language,
    totalFields,
    visibleFields.length,
  ]);

  useEffect(() => {
    const trackSurveyAbandon = (transportType) => {
      const context = abandonContextRef.current;

      if (
        hasTrackedAbandonRef.current ||
        hasSubmittedRef.current ||
        !context ||
        context.hasSubmitted ||
        !context.hasStarted
      ) {
        return;
      }

      hasTrackedAbandonRef.current = true;
      trackEvent("survey_abandon", {
        survey_id: SURVEY_ANALYTICS_ID,
        language: context.language,
        step_id: context.currentStepId,
        step_number: context.currentStepNumber,
        answered_field_count: context.answeredFieldCount,
        total_field_count: context.totalFieldCount,
        visible_field_count: context.visibleFieldCount,
        last_field_id: context.lastInteraction?.fieldId ?? "",
        last_field_kind: context.lastInteraction?.fieldKind ?? "",
        transport_type: transportType,
      });
    };

    const handlePageHide = () => {
      trackSurveyAbandon("beacon");
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);

      if (process.env.NODE_ENV === "production") {
        trackSurveyAbandon("navigation");
      }
    };
  }, []);

  const trackSurveyFieldInteraction = ({
    rawFieldId,
    interactionType,
    isComplete,
    selectionCount,
  }) => {
    const meta = analyticsFieldMap.get(rawFieldId);

    if (!meta) {
      return;
    }

    hasStartedRef.current = true;
    lastInteractionRef.current = {
      fieldId: meta.field.id,
      fieldKind: meta.field.kind,
      stepId: meta.step.id,
      stepNumber: meta.stepIndex + 1,
    };

    trackEvent("survey_field_interaction", {
      survey_id: SURVEY_ANALYTICS_ID,
      language,
      step_id: meta.step.id,
      step_number: meta.stepIndex + 1,
      field_id: meta.field.id,
      field_kind: meta.field.kind,
      interaction_type: interactionType,
      input_target: meta.inputTarget ?? "",
      selection_count: selectionCount,
      is_complete: Boolean(isComplete),
    });
  };

  const handleLanguageChange = (nextLanguage) => {
    const normalizedLanguage = normalizeSiteLanguage(nextLanguage);

    trackEvent("language_switch", {
      component: "survey",
      from_language: language,
      to_language: normalizedLanguage,
    });

    setLanguage(normalizedLanguage);
    router.replace(`${pathname}?lang=${normalizedLanguage}`, { scroll: false });
  };

  const handleTextChange = (fieldId, value) => {
    setSubmitError("");
    const nextAnswers = {
      ...answers,
      [fieldId]: value,
    };
    const meta = analyticsFieldMap.get(fieldId);

    if (fieldId === "contactEmail" && answers.contactEmailConfirmed) {
      nextAnswers.contactEmailConfirmed = false;
    }

    setAnswers(nextAnswers);

    if (!meta) {
      return;
    }

    if (meta.field.kind === "datetimeRange") {
      const nextRangeKey = isValidDateRange(
        nextAnswers[meta.field.startId],
        nextAnswers[meta.field.endId],
      )
        ? `${nextAnswers[meta.field.startId]}:${nextAnswers[meta.field.endId]}`
        : "";

      if (!nextRangeKey) {
        lastDateRangeKeyRef.current = "";
        return;
      }

      if (lastDateRangeKeyRef.current === nextRangeKey) {
        return;
      }

      lastDateRangeKeyRef.current = nextRangeKey;
      trackSurveyFieldInteraction({
        rawFieldId: fieldId,
        interactionType: "date_range_set",
        isComplete: true,
        selectionCount: getTravelDateValues(
          nextAnswers[meta.field.startId],
          nextAnswers[meta.field.endId],
        ).length,
      });
      return;
    }

    const normalizedValue =
      typeof value === "string" ? value.trim() : String(value ?? "").trim();

    if (!normalizedValue) {
      return;
    }

    const onceKey = `${fieldId}:started`;

    if (trackedFieldStartsRef.current.has(onceKey)) {
      return;
    }

    trackedFieldStartsRef.current.add(onceKey);
    trackSurveyFieldInteraction({
      rawFieldId: fieldId,
      interactionType:
        meta.field.kind === "range" ? "range_started" : "input_started",
      isComplete: isFieldAnswered(meta.field, nextAnswers),
    });
  };

  const handleSingleChange = (fieldId, value) => {
    setSubmitError("");
    const nextAnswers = {
      ...answers,
      [fieldId]: value,
    };

    setAnswers(nextAnswers);
    trackSurveyFieldInteraction({
      rawFieldId: fieldId,
      interactionType: "option_selected",
      isComplete: true,
      selectionCount: 1,
    });
  };

  const handleCheckboxChange = (fieldId, checked) => {
    setSubmitError("");
    const nextAnswers = {
      ...answers,
      [fieldId]: checked,
    };

    setAnswers(nextAnswers);
    trackSurveyFieldInteraction({
      rawFieldId: fieldId,
      interactionType: checked ? "option_selected" : "option_removed",
      isComplete: checked,
      selectionCount: checked ? 1 : 0,
    });
  };

  const handleMultiToggle = (fieldId, value, maxSelections) => {
    setSubmitError("");
    const currentValues = Array.isArray(answers[fieldId]) ? answers[fieldId] : [];
    const isSelected = currentValues.includes(value);

    if (maxSelections && !isSelected && currentValues.length >= maxSelections) {
      return;
    }

    const nextValues = isSelected
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    const nextAnswers = {
      ...answers,
      [fieldId]: nextValues,
    };

    setAnswers(nextAnswers);
    trackSurveyFieldInteraction({
      rawFieldId: fieldId,
      interactionType: isSelected ? "option_removed" : "option_added",
      isComplete: nextValues.length > 0,
      selectionCount: nextValues.length,
    });
  };

  const buildSubmissionSummary = () => {
    const fullName = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("fullName"),
      language,
    });
    const destination = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("destination"),
      language,
    });
    const contactEmail = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("contactEmail"),
      language,
    });
    const travelDates = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("travelDates"),
      language,
    });
    const age = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("age"),
      language,
    });
    const gender = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("gender"),
      language,
    });
    const mbti = formatSummaryValue({
      answers,
      fallback: "",
      field: fieldMap.get("mbti"),
      language,
    });
    const travelCompanion = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("travelCompanion"),
      language,
    });
    const mainGoals = formatSummaryValue({
      answers,
      extraFieldId: "mainGoalsOther",
      fallback: content.summaryFallback,
      field: fieldMap.get("mainGoals"),
      language,
    });
    const dailyBudget = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("dailyBudget"),
      language,
    });
    const guideDates = formatSummaryValue({
      answers,
      fallback: content.summaryFallback,
      field: fieldMap.get("guideDates"),
      language,
    });
    const wechatId =
      typeof answers.wechatId === "string" ? answers.wechatId.trim() : "";
    const phoneNumber =
      typeof answers.phoneNumber === "string" ? answers.phoneNumber.trim() : "";

    const summaryItems = [
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
      { label: content.summaryItems[5].label, value: guideDates },
      { label: content.summaryBudgetLabel, value: dailyBudget },
    ];

    if (wechatId) {
      summaryItems.push({
        label: content.summaryWechatLabel,
        value: wechatId,
      });
    }

    if (phoneNumber) {
      summaryItems.push({
        label: content.summaryPhoneLabel,
        value: phoneNumber,
      });
    }

    return summaryItems;
  };

  const runSubmission = async () => {
    const guidePricingQuote = getGuidePricingQuote({
      guideDayCount: getGuideDayCountFromAnswers(answers),
      language,
    });

    trackEvent("survey_submit_attempt", {
      survey_id: SURVEY_ANALYTICS_ID,
      language,
      step_id: currentStepId,
      step_number: currentStepIndex + 1,
      answered_field_count: answeredOverall,
      total_field_count: totalFields,
    });

    const missingRequiredField = findFirstMissingRequiredField(steps, answers);

    if (missingRequiredField) {
      const missingFieldMeta = analyticsFieldMap.get(missingRequiredField.fieldId);
      const isEmailConfirmField =
        missingRequiredField.fieldId === "contactEmailConfirmed";

      trackEvent("survey_validation_error", {
        survey_id: SURVEY_ANALYTICS_ID,
        language,
        step_id: missingFieldMeta?.step.id ?? "",
        step_number:
          typeof missingRequiredField.stepIndex === "number"
            ? missingRequiredField.stepIndex + 1
            : undefined,
        field_id: missingRequiredField.fieldId,
        validation_reason: isEmailConfirmField
          ? "email_unconfirmed"
          : "required_missing",
      });
      setCurrentStepIndex(missingRequiredField.stepIndex);
      setSubmitError(
        isEmailConfirmField
          ? content.emailConfirmRequiredError
          : content.requiredFieldError,
      );
      return;
    }

    const contactEmail =
      typeof answers.contactEmail === "string" ? answers.contactEmail.trim() : "";
    const isContactEmailConfirmed = answers.contactEmailConfirmed === true;

    if (!isValidEmail(contactEmail)) {
      trackEvent("survey_validation_error", {
        survey_id: SURVEY_ANALYTICS_ID,
        language,
        step_id: "basicInformation",
        step_number: 1,
        field_id: "contactEmail",
        validation_reason: "invalid_email",
      });
      setCurrentStepIndex(0);
      setSubmitError(content.emailRequiredError);
      return;
    }

    if (!isContactEmailConfirmed) {
      trackEvent("survey_validation_error", {
        survey_id: SURVEY_ANALYTICS_ID,
        language,
        step_id: "basicInformation",
        step_number: 1,
        field_id: "contactEmailConfirmed",
        validation_reason: "email_unconfirmed",
      });
      setCurrentStepIndex(0);
      setSubmitError(content.emailConfirmRequiredError);
      return;
    }

    if (!isAuthenticated) {
      submitAfterAuthRef.current = true;
      setShowSubmitLoginGate(true);
      openAuthModal("signIn", "survey-submit");
      return;
    }

    if (!isEmailVerified) {
      submitAfterAuthRef.current = false;
      setShowSubmitLoginGate(true);
      setSubmitError(
        language === "ko"
          ? "설문을 제출하려면 회원가입 후 이메일 인증을 먼저 완료해 주세요."
          : language === "en"
            ? "Please complete email verification before submitting the survey."
            : "提交问卷前请先完成邮箱验证。",
      );
      openAuthModal("signIn", "survey-submit");
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

        if (mode === "edit") {
          if (!existingSubmission?.id || !existingSubmission.isEditable) {
            throw new Error(modeContent.editLockedError);
          }

          const updatedSubmission = await updateRemoteSubmission(
            existingSubmission.id,
            submissionPayload,
          );

          hasSubmittedRef.current = true;
          abandonContextRef.current = {
            ...abandonContextRef.current,
            hasSubmitted: true,
          };
          saveSurveySubmission({
            ...updatedSubmission,
            storageMode: "server",
          });
          router.push(`/survey/complete?id=${updatedSubmission.id}&lang=${language}`);
          return;
        }

        let submission = null;

        try {
          submission = await createRemoteSubmission(submissionPayload);
        } catch (error) {
          if (error?.status === 401) {
            setIsSubmitting(false);
            submitAfterAuthRef.current = true;
            setShowSubmitLoginGate(true);
            openAuthModal("signIn", "survey-submit");
            return;
          }

          if (!shouldFallBackToLocalSave(error)) {
            throw error;
          }
        }

        if (submission?.id) {
          hasSubmittedRef.current = true;
          abandonContextRef.current = {
            ...abandonContextRef.current,
            hasSubmitted: true,
          };
          trackEvent("survey_submit_success", {
            survey_id: SURVEY_ANALYTICS_ID,
            language,
            storage_mode: "server",
            answered_field_count: answeredOverall,
            total_field_count: totalFields,
            guide_day_count: Number(guidePricingQuote.guideDayCount),
            discount_percent: Number(guidePricingQuote.discountPercent),
            amount: Number(guidePricingQuote.totalAmount),
            currency: guidePricingQuote.currency,
          });
          saveSurveySubmission({
            ...submission,
            storageMode: "server",
          });
          router.push(`/survey/complete?id=${submission.id}&lang=${language}`);
          return;
        }

        const nextSubmissionId = createSurveySubmissionId();
        const localSubmission = {
          id: nextSubmissionId,
          language,
          contactEmail,
          applicantName:
            typeof answers.fullName === "string" ? answers.fullName.trim() : "",
          answers: {
            ...answers,
            contactEmail,
          },
          summary: submissionPayload.summary,
          submittedAt: new Date().toISOString(),
          guideDayCount: guidePricingQuote.guideDayCount,
          quotedAmount: guidePricingQuote.totalAmount,
          quotedCurrency: guidePricingQuote.currency,
          quotedDisplayLabel: formatPaymentDisplayLabel({
            amount: guidePricingQuote.totalAmount,
            currency: guidePricingQuote.currency,
            language,
          }),
          paymentMethod: getPaymentMethodForLanguage(language),
          submissionStatus: "awaiting_transfer",
          isEditable: true,
          storageMode: "local",
        };
        const didSave = saveSurveySubmission(localSubmission);

        if (!didSave) {
          throw new Error("Failed to save submission locally.");
        }

        hasSubmittedRef.current = true;
        abandonContextRef.current = {
          ...abandonContextRef.current,
          hasSubmitted: true,
        };
        trackEvent("survey_submit_success", {
          survey_id: SURVEY_ANALYTICS_ID,
          language,
          storage_mode: "local",
          answered_field_count: answeredOverall,
          total_field_count: totalFields,
          guide_day_count: Number(guidePricingQuote.guideDayCount),
          discount_percent: Number(guidePricingQuote.discountPercent),
          amount: Number(guidePricingQuote.totalAmount),
          currency: guidePricingQuote.currency,
        });
        router.push(`/survey/complete?id=${nextSubmissionId}&lang=${language}`);
      } catch (error) {
        console.error(error);
        trackEvent("survey_submit_error", {
        survey_id: SURVEY_ANALYTICS_ID,
        language,
          step_id: currentStepId,
          step_number: currentStepIndex + 1,
        });
        setSubmitError(
          mode === "edit"
            ? error?.message || modeContent.editSubmitError
            : content.submitError,
        );
        setIsSubmitting(false);
      }
  };

  useEffect(() => {
    if (!isAuthenticated || !isEmailVerified || !submitAfterAuthRef.current || isSubmitting) {
      return;
    }

    submitAfterAuthRef.current = false;
    setShowSubmitLoginGate(false);
    void runSubmission();
  }, [isAuthenticated, isEmailVerified, isSubmitting]);

  if (mode === "edit" && (isLoadingExistingSubmission || editLoadError)) {
    return (
      <main className="survey-page">
        <section className="survey-shell single">
          <div className="survey-main-card">
            <div className="survey-main-header">
              <div>
                <span className="survey-card-kicker">{content.sidebarKicker}</span>
                <h2>{modeContent.editTitle}</h2>
              </div>
            </div>
            <p className="survey-main-description">
              {isLoadingExistingSubmission ? modeContent.editLoading : editLoadError}
            </p>
            <div className="survey-main-actions">
              <Link className="survey-secondary-button as-link" href={`/account?lang=${language}`}>
                {modeContent.editBack}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="survey-page">
      <div className="survey-backdrop survey-backdrop-left" />
      <div className="survey-backdrop survey-backdrop-right" />

      <header className="survey-topbar">
        <div className="survey-brand-block">
          <Link
            className="survey-back-link"
            href={mode === "edit" ? `/account?lang=${language}` : `/?lang=${language}`}
          >
            {mode === "edit" ? modeContent.editBack : content.back}
          </Link>
          <div className="survey-brandmark">{content.brand}</div>
        </div>

        <div className="topbar-actions">
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
          <AuthButtons compact language={language} />
        </div>
      </header>

      <section className="survey-hero">
          <div className="survey-hero-copy">
            <span className="survey-kicker">{content.sidebarKicker}</span>
            <h1>{mode === "edit" ? modeContent.editTitle : content.title}</h1>
            <p>{mode === "edit" ? modeContent.editSubtitle : content.subtitle}</p>
          </div>
      </section>

      <section className="survey-shell">
        <aside className="survey-side-panel">
          <div className="survey-side-card">
            <span className="survey-card-kicker">{content.sidebarKicker}</span>
            <h2>{content.sidebarTitle}</h2>
            <p>{mode === "edit" ? modeContent.editSidebarText : content.sidebarText}</p>

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
                      language,
                    })}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="survey-side-card compact">
            <span className="survey-card-kicker">{content.pricingTitle}</span>
            {livePricingQuote ? (
              <div className="survey-summary-list">
                <div className="survey-summary-row">
                  <span>{content.pricingGuideDaysLabel}</span>
                  <strong>{selectedGuideDayCount}</strong>
                </div>
                <div className="survey-summary-row">
                  <span>{content.pricingDailyRateLabel}</span>
                  <strong>
                    {content.pricingDailyRateValue(liveDailyRateLabel)}
                  </strong>
                </div>
                <div className="survey-summary-row">
                  <span>{content.pricingTotalLabel}</span>
                  <strong>{livePaymentDisplayLabel}</strong>
                </div>
              </div>
            ) : (
              <p className="survey-pricing-empty">{content.pricingEmpty}</p>
            )}
            <p className="survey-pricing-hint">{content.pricingHint}</p>
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
                  {field.id === "guideDates" ? (
                    <div className="survey-pricing-note">
                      <strong className="survey-pricing-note-title">
                        {content.guidePricingNoticeTitle}
                      </strong>
                      <div className="survey-pricing-note-list">
                        <span>
                          {content.guidePricingNoticeOneDay(oneDayDailyRateLabel)}
                        </span>
                        <span>{content.guidePricingNoticeTwoDays(twoDayDailyRateLabel)}</span>
                        <span>{content.guidePricingNoticeThreeDays(threeDayDailyRateLabel)}</span>
                      </div>
                      <div className="survey-pricing-note-footer">
                        <strong>
                          {content.guidePricingNoticeExample(twoDayPricingLabel)}
                        </strong>
                        <span>{content.guidePricingNoticeFootnote}</span>
                      </div>
                    </div>
                  ) : null}
                  <SurveyField
                    answers={answers}
                    content={content}
                    field={field}
                    fieldValue={fieldValue}
                    language={language}
                    onCheckboxChange={handleCheckboxChange}
                    onMultiToggle={handleMultiToggle}
                    onSingleChange={handleSingleChange}
                    onTextChange={handleTextChange}
                  />
                  {field.id === "guideDates" && livePricingQuote ? (
                    <div className="survey-inline-quote">
                      <strong className="survey-inline-quote-title">
                        {content.inlineQuoteTitle}
                      </strong>
                      <div className="survey-summary-list">
                        <div className="survey-summary-row">
                          <span>{content.pricingGuideDaysLabel}</span>
                          <strong>{selectedGuideDayCount}</strong>
                        </div>
                        <div className="survey-summary-row">
                          <span>{content.pricingDailyRateLabel}</span>
                          <strong>
                            {content.pricingDailyRateValue(liveDailyRateLabel)}
                          </strong>
                        </div>
                        <div className="survey-summary-row">
                          <span>{content.pricingTotalLabel}</span>
                          <strong>{livePaymentDisplayLabel}</strong>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
                  ? () => void runSubmission()
                  : () =>
                      setCurrentStepIndex((prev) =>
                        Math.min(steps.length - 1, prev + 1),
                      )
              }
              type="button"
            >
              {isSubmitting
                ? mode === "edit"
                  ? modeContent.editSubmitting
                  : content.submitting
                : currentStepIndex === steps.length - 1
                  ? mode === "edit"
                    ? modeContent.editFinish
                    : content.finish
                  : content.next}
            </button>
          </div>
          {showSubmitLoginGate && currentStepIndex === steps.length - 1 ? (
            <div className="survey-auth-gate">
              <strong>
                {language === "ko"
                  ? "제출 전 로그인 필요"
                  : language === "en"
                    ? "Login needed before submit"
                    : "提交前需要登录"}
              </strong>
              <p>
                {language === "ko"
                  ? "설문은 로그인 없이 작성할 수 있지만, 제출하려면 로그인된 계정이 필요합니다."
                  : language === "en"
                    ? "You can fill out the survey without logging in, but submitting it requires a logged-in account."
                    : "你可以先不登录填写问卷，但提交时需要先登录账号。"}
              </p>
              <div className="survey-auth-gate-actions">
                <button
                  className="survey-secondary-button"
                  onClick={() => openAuthModal("signIn", "survey-submit")}
                  type="button"
                >
                  {language === "ko" ? "로그인" : language === "en" ? "Log in" : "登录"}
                </button>
                <button
                  className="survey-secondary-button"
                  onClick={() => openAuthModal("signUp", "survey-submit")}
                  type="button"
                >
                  {language === "ko" ? "회원가입" : language === "en" ? "Sign up" : "注册"}
                </button>
              </div>
            </div>
          ) : null}
          {submitError ? <p className="survey-submit-error">{submitError}</p> : null}
        </div>
      </section>
    </main>
  );
}
