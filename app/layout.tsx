import SupportFab from "@/app/components/SupportFab";
import type { Metadata } from "next";
import "./globals.css";
import { Cairo } from "next/font/google";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";

const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "مِسك | اتعلم • طبّق • اختبر",
  description: "تعلم مقررات الكمبيوتر والبرمجة والذكاء الاصطناعي بطريقة أسهل",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className + " bg-slate-50 text-slate-900"}>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <SupportFab />
        <SiteFooter />
      </body>
    </html>
  );
}