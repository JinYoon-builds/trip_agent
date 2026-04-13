"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const translations = {
  ko: {
    logo: "tripagent",
    announce: "프라이빗 가이드 매칭 오픈",
    titleLine1: "한국 여행의 즐거움을",
    titleLine2: "나만의 가이드와",
    titleLine3: "프라이빗하게 만나보세요",
    description:
      "한국 현지 대학생들과 관광 전문가들이\n당신의 여행 목적, 취향, 예산, 동행 구성에 맞춰\n프라이빗 가이드가 되어드립니다.",
    primaryButton: "내 여행에 딱 맞는 가이드 배정받기",
    statPrimary: "실시간 비대면 연결",
    statSecondary: "현지 대학생 + 관광 전문가",
    statTertiary: "취향 기반 1:1 매칭",
    phoneTitle: "나의 한국 여행",
    phoneBadge: "실시간",
    phoneCta: "시작",
    phoneCardTitle: "새 여행 만들기",
    phoneCardText: "여행 취향을 입력하고 실시간 가이드 매칭을 시작하세요.",
    phonePlanTag: "프라이빗 플랜",
    phonePlanTitle: "서울 프라이빗 플랜",
    phonePlanText: "북촌 · 경복궁 · K-pop · 뷰티",
    leftTag: "북촌",
    rightTag: "경복궁",
    cityTag: "서울 야경",
    posterLeft: "K-스타일",
    posterRight: "K-pop",
    footerModeLabel: "방식",
    footerModeValue: "비대면",
    footerLanguageLabel: "언어",
    footerLanguageValue: "한국어 / 中文",
  },
  zh: {
    logo: "tripagent",
    announce: "私人向导匹配已开启",
    titleLine1: "重新发现",
    titleLine2: "韩国旅行的乐趣",
    titleLine3: "更私密地与你的向导相遇",
    description:
      "韩国本地大学生与旅游专家会\n根据你的旅行目的、偏好、预算和同行对象\n为你匹配最合适的私人向导。",
    primaryButton: "为我的旅行匹配最合适的向导",
    statPrimary: "实时远程连接",
    statSecondary: "本地大学生 + 旅游专家",
    statTertiary: "基于偏好的 1:1 匹配",
    phoneTitle: "我的韩国旅行",
    phoneBadge: "实时",
    phoneCta: "开始",
    phoneCardTitle: "创建新旅程",
    phoneCardText: "填写旅行偏好并开始实时向导匹配。",
    phonePlanTag: "私人行程",
    phonePlanTitle: "首尔私人路线",
    phonePlanText: "北村 · 景福宫 · K-pop · 美妆",
    leftTag: "北村",
    rightTag: "景福宫",
    cityTag: "首尔夜景",
    posterLeft: "K-风格",
    posterRight: "K-pop",
    footerModeLabel: "方式",
    footerModeValue: "远程",
    footerLanguageLabel: "语言",
    footerLanguageValue: "韩语 / 中文",
  },
};

function FloatingPhoto({ className, src, alt, tag, priority = false }) {
  return (
    <div className={className}>
      <Image alt={alt} fill priority={priority} sizes="(max-width: 900px) 40vw, 20vw" src={src} />
      <span>{tag}</span>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState("ko");
  const t = translations[language];

  return (
    <main className="hero-page">
      <div className="hero-orb hero-orb-left" />
      <div className="hero-orb hero-orb-right" />

      <header className="topbar">
        <div className="brandmark">{t.logo}</div>

        <div className="topbar-actions">
          <div className="language-switch" role="tablist" aria-label="language switch">
            <button
              className={language === "ko" ? "lang-chip active" : "lang-chip"}
              onClick={() => setLanguage("ko")}
              type="button"
            >
              한국어
            </button>
            <button
              className={language === "zh" ? "lang-chip active" : "lang-chip"}
              onClick={() => setLanguage("zh")}
              type="button"
            >
              中文
            </button>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="announce-pill">
            <span className="announce-dot" />
            {t.announce}
          </div>

          <h1>
            <span>{t.titleLine1}</span>
            <span className="accent">{t.titleLine2}</span>
            <span>{t.titleLine3}</span>
          </h1>

          <p>{t.description}</p>

          <div className="hero-cta-row">
            <Link className="hero-cta-button" href={`/survey?lang=${language}`}>
              {t.primaryButton}
            </Link>
          </div>

          <div className="hero-stats">
            <span>{t.statPrimary}</span>
            <span>{t.statSecondary}</span>
            <span>{t.statTertiary}</span>
          </div>
        </div>

        <div className="hero-stage">
          <div className="stage-ribbon ribbon-left" />
          <div className="stage-ribbon ribbon-right" />

          <FloatingPhoto
            alt="Bukchon Hanok Village"
            className="floating-photo floating-photo-left"
            priority
            src="/decor/20201230172547741_X4PVBAOC.webp"
            tag={t.leftTag}
          />

          <FloatingPhoto
            alt="Gyeongbokgung Palace"
            className="floating-photo floating-photo-right"
            src="/decor/istockphoto-1676101015-612x612.jpg"
            tag={t.rightTag}
          />

          <FloatingPhoto
            alt="Seoul skyline"
            className="floating-photo floating-photo-city"
            src="/decor/839938e7-9518-4d99-960e-1bcbf1b3b7ee.webp"
            tag={t.cityTag}
          />

          <div className="poster-card poster-left">
            <Image alt="K culture poster" fill sizes="160px" src="/decor/vb0GFSR8joUYTi-cSrXlR-UwRLKb_P1pvMSEAAE9kxzUOnUe9eyw24LGl1ZgbPh8b2vq3yvU39PLouINngkLQQ.webp" />
            <span>{t.posterLeft}</span>
          </div>

          <div className="poster-card poster-right">
            <Image alt="BTS cinema poster" fill sizes="160px" src="/decor/news-p.v1.20230201.e3a19e3c5e654dee8c18d6e5486dd402_Z1.jpg" />
            <span>{t.posterRight}</span>
          </div>

          <div className="phone-shell">
            <div className="phone-top" />
            <div className="phone-screen">
              <div className="phone-header">
                <div>
                  <span className="mini-logo">tg</span>
                  <strong>{t.phoneTitle}</strong>
                </div>
                <span className="live-pill">{t.phoneBadge}</span>
              </div>

              <div className="phone-cta-card">
                <div>
                  <strong>{t.phoneCardTitle}</strong>
                  <p>{t.phoneCardText}</p>
                </div>
                <button type="button">{t.phoneCta}</button>
              </div>

              <article className="trip-card">
                <div className="trip-thumb">
                  <Image alt="Private Seoul plan thumbnail" fill sizes="240px" src="/decor/20201230172547741_X4PVBAOC.webp" />
                </div>
                <div className="trip-copy">
                  <span>{t.phonePlanTag}</span>
                  <strong>{t.phonePlanTitle}</strong>
                  <p>{t.phonePlanText}</p>
                </div>
              </article>

              <div className="phone-footer-grid">
                <div>
                  <span>{t.footerModeLabel}</span>
                  <strong>{t.footerModeValue}</strong>
                </div>
                <div>
                  <span>{t.footerLanguageLabel}</span>
                  <strong>{t.footerLanguageValue}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
