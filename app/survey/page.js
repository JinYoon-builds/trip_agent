import Link from "next/link";

const surveyLayoutCopy = {
  ko: {
    brand: "tripagent",
    back: "랜딩으로 돌아가기",
    title: "여행 성향 설문",
    subtitle: "질문 내용은 아직 넣지 않고, 설문조사 페이지의 전체 구조와 흐름만 먼저 잡아둔 상태입니다.",
    sidebarKicker: "Survey Flow",
    sidebarTitle: "설문 진행 레이아웃",
    sidebarText: "좌측에는 진행 상황과 요약 정보, 우측에는 단계별 질문 카드가 들어가는 구조입니다.",
    progressLabel: "진행률",
    progressValue: "1 / 5 단계",
    summaryTitle: "여행 프로필 요약",
    summaryItems: [
      { label: "목적지", value: "미정" },
      { label: "동행", value: "미정" },
      { label: "예산", value: "미정" },
      { label: "핵심 관심사", value: "미정" },
    ],
    steps: ["기본 정보", "여행 목적", "소비 성향", "관심사 / 취향", "여행 MBTI"],
    cardKicker: "Step 01",
    cardTitle: "기본 정보",
    cardText: "이 영역에 실제 질문, 입력창, 선택형 버튼이 들어갑니다. 지금은 레이아웃 비율과 흐름만 먼저 구현했습니다.",
    blockTitle: "Question Block",
    secondaryAction: "이전",
    primaryAction: "다음 단계",
  },
  zh: {
    brand: "tripagent",
    back: "返回落地页",
    title: "旅行偏好问卷",
    subtitle: "目前先不放入真实问题，只先搭好问卷页面的整体结构与浏览流程。",
    sidebarKicker: "Survey Flow",
    sidebarTitle: "问卷页面布局",
    sidebarText: "左侧放进度与摘要信息，右侧放每一步的问题卡片，这一版先把版式搭好。",
    progressLabel: "进度",
    progressValue: "1 / 5 步",
    summaryTitle: "旅行画像摘要",
    summaryItems: [
      { label: "目的地", value: "待填写" },
      { label: "同行", value: "待填写" },
      { label: "预算", value: "待填写" },
      { label: "核心兴趣", value: "待填写" },
    ],
    steps: ["基本信息", "旅行目的", "消费倾向", "兴趣 / 偏好", "旅行 MBTI"],
    cardKicker: "Step 01",
    cardTitle: "基本信息",
    cardText: "这里以后会放入真实问题、输入框与选择按钮。当前阶段只先实现页面结构与层级关系。",
    blockTitle: "Question Block",
    secondaryAction: "上一步",
    primaryAction: "下一步",
  },
};

export default async function SurveyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const language = resolvedSearchParams?.lang === "zh" ? "zh" : "ko";
  const t = surveyLayoutCopy[language];

  return (
    <main className="survey-page">
      <div className="survey-backdrop survey-backdrop-left" />
      <div className="survey-backdrop survey-backdrop-right" />

      <header className="survey-topbar">
        <div className="survey-brand-block">
          <Link className="survey-back-link" href="/">
            {t.back}
          </Link>
          <div className="survey-brandmark">{t.brand}</div>
        </div>

        <div className="language-switch" role="tablist" aria-label="language switch">
          <Link className={language === "ko" ? "lang-chip active" : "lang-chip"} href="/survey?lang=ko">
            한국어
          </Link>
          <Link className={language === "zh" ? "lang-chip active" : "lang-chip"} href="/survey?lang=zh">
            中文
          </Link>
        </div>
      </header>

      <section className="survey-hero">
        <div className="survey-hero-copy">
          <span className="survey-kicker">{t.sidebarKicker}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </section>

      <section className="survey-shell">
        <aside className="survey-side-panel">
          <div className="survey-side-card">
            <span className="survey-card-kicker">{t.sidebarKicker}</span>
            <h2>{t.sidebarTitle}</h2>
            <p>{t.sidebarText}</p>

            <div className="survey-progress-card">
              <span>{t.progressLabel}</span>
              <strong>{t.progressValue}</strong>
              <div className="survey-progress-track">
                <div className="survey-progress-value" />
              </div>
            </div>

            <div className="survey-step-list">
              {t.steps.map((step, index) => (
                <div className={index === 0 ? "survey-step-item active" : "survey-step-item"} key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="survey-side-card compact">
            <span className="survey-card-kicker">{t.summaryTitle}</span>
            <div className="survey-summary-list">
              {t.summaryItems.map((item) => (
                <div className="survey-summary-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="survey-main-card">
          <div className="survey-main-header">
            <div>
              <span className="survey-card-kicker">{t.cardKicker}</span>
              <h2>{t.cardTitle}</h2>
            </div>
            <div className="survey-main-pill">{t.blockTitle}</div>
          </div>

          <p className="survey-main-description">{t.cardText}</p>

          <div className="survey-placeholder-stack">
            <div className="survey-placeholder-group">
              <span className="survey-placeholder-label">{t.blockTitle}</span>
              <div className="survey-placeholder-input" />
            </div>

            <div className="survey-placeholder-group">
              <span className="survey-placeholder-label">{t.blockTitle}</span>
              <div className="survey-placeholder-input large" />
            </div>

            <div className="survey-placeholder-group">
              <span className="survey-placeholder-label">{t.blockTitle}</span>
              <div className="survey-placeholder-choice-grid">
                <div className="survey-placeholder-choice" />
                <div className="survey-placeholder-choice" />
                <div className="survey-placeholder-choice" />
              </div>
            </div>

            <div className="survey-placeholder-group">
              <span className="survey-placeholder-label">{t.blockTitle}</span>
              <div className="survey-placeholder-chip-row">
                <div className="survey-placeholder-chip" />
                <div className="survey-placeholder-chip" />
                <div className="survey-placeholder-chip" />
                <div className="survey-placeholder-chip" />
              </div>
            </div>
          </div>

          <div className="survey-main-actions">
            <button className="survey-secondary-button" type="button">
              {t.secondaryAction}
            </button>
            <button className="survey-primary-button" type="button">
              {t.primaryAction}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
