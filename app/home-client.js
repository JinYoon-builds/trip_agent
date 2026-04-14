"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { normalizeSiteLanguage } from "../lib/language";

const translations = {
  en: {
    logo: "tripagent",
    announce: "Private guide matching is live",
    titleLine1: "Travel Korea with",
    titleLine2: "your own local guide",
    titleLine3: "and make the whole trip feel personal",
    description:
      "Local university students and travel specialists in Korea\nmatch you with a private guide based on your trip goals,\ntravel style, budget, and who you are traveling with.",
    primaryButton: "Get matched with the right guide for my trip",
    statPrimary: "Real-time remote matching",
    statSecondary: "Local students + travel specialists",
    statTertiary: "Preference-based 1:1 matching",
  },
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
  },
};

function FloatingPhoto({ className, src, alt, priority = false }) {
  return (
    <div className={className}>
      <Image alt={alt} fill priority={priority} sizes="(max-width: 900px) 40vw, 20vw" src={src} />
    </div>
  );
}

export default function HomeClient({ initialLanguage }) {
  const pathname = usePathname();
  const router = useRouter();
  const language = normalizeSiteLanguage(initialLanguage);
  const t = translations[language];

  const handleLanguageChange = (nextLanguage) => {
    router.replace(`${pathname}?lang=${normalizeSiteLanguage(nextLanguage)}`, {
      scroll: false,
    });
  };

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
          />

          <FloatingPhoto
            alt="Gyeongbokgung Palace"
            className="floating-photo floating-photo-right"
            src="/decor/istockphoto-1676101015-612x612.jpg"
          />

          <FloatingPhoto
            alt="Seoul skyline"
            className="floating-photo floating-photo-city"
            src="/decor/839938e7-9518-4d99-960e-1bcbf1b3b7ee.webp"
          />

          <div className="poster-card poster-left">
            <Image alt="K culture poster" fill sizes="160px" src="/decor/vb0GFSR8joUYTi-cSrXlR-UwRLKb_P1pvMSEAAE9kxzUOnUe9eyw24LGl1ZgbPh8b2vq3yvU39PLouINngkLQQ.webp" />
          </div>

          <div className="poster-card poster-right">
            <Image alt="BTS cinema poster" fill sizes="160px" src="/decor/news-p.v1.20230201.e3a19e3c5e654dee8c18d6e5486dd402_Z1.jpg" />
          </div>
        </div>
      </section>
    </main>
  );
}
