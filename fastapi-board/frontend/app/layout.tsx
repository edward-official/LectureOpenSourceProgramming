import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "게시판",
  description: "간단한 게시판 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-black antialiased">{children}</body>
    </html>
  );
}
