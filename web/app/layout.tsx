import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/components/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IndieFilm Hub - 인디 영화 허브",
  description: "대학생 동아리·인디 영화 제작자와 배우 지망생을 위한 네트워킹 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <Navigation />
            <div className="pt-[60px] md:pt-0 md:ml-64">
              {children}
            </div>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
