import "./globals.css";
import Script from "next/script";

import Ga4PageTracker from "./ga4-page-tracker";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export const metadata = {
  title: "lie-unnie",
  description: "Private remote tourism guide matching service for Chinese travelers in Korea.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
              `}
            </Script>
            <Ga4PageTracker />
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
