import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Watcha Doing with My Comments",
  description: "내가 쓴 한줄평만 보고 영화를 맞추는 개인용 퀴즈 게임",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={notoSansKr.variable}>{children}</body>
    </html>
  );
}
