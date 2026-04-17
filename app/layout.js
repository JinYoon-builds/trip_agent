import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";

import Ga4PageTracker from "./ga4-page-tracker";

const DEFAULT_GTM_ID = "GTM-5GMTXZZV";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || DEFAULT_GTM_ID;
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const shouldUseGtm = Boolean(GTM_ID);
const shouldUseDirectGa = !shouldUseGtm && Boolean(GA_MEASUREMENT_ID);

export const metadata = {
  title: "刘Unnie",
  description: "Private remote tourism guide matching service for Chinese travelers in Korea.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      {shouldUseGtm ? (
        <Script id="gtm-init" strategy="beforeInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      ) : null}
      <body>
        {shouldUseGtm ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        {shouldUseDirectGa ? (
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
          </>
        ) : null}
        {shouldUseGtm || shouldUseDirectGa ? (
          <Suspense fallback={null}>
            <Ga4PageTracker />
          </Suspense>
        ) : null}
        {children}
      </body>
    </html>
  );
}
