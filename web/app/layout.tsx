import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/components/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const notoSans = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "인디필름 — 독립영화의 모든 것",
  description: "배우, 제작진, 관객, 장소가 한 곳에서 만나는 독립영화 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${notoSans.variable} ${notoSerif.variable} ${bebasNeue.variable} font-sans antialiased bg-[#0a0805] text-[#f0e8d8] min-h-screen`}
      >
        <div className="grain-overlay" aria-hidden />
        <ErrorBoundary>
          <ToastProvider>
            <Navigation />
            <main className="min-h-screen pt-16">
              {children}
            </main>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
