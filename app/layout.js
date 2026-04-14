import "./globals.css";

export const metadata = {
  title: "lie-unnie",
  description: "Private remote tourism guide matching service for Chinese travelers in Korea.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
