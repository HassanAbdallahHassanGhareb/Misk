"use client";

import Link from "next/link";
import AuthButton from "@/app/components/AuthButton";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* اللوجو + اسم مِسك (بالضغط يرجع للرئيسية) */}
        <Link href="/" className="flex items-center gap-4">
          <img
            src="/logo-mark.svg"
            alt="مِسك"
            className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-sm"
          />

          <div className="leading-tight">
            <div className="text-lg sm:text-xl font-extrabold">مِسك</div>
            <div className="text-xs sm:text-sm text-slate-600 hidden sm:block">
              اتعلم • طبّق • اختبر
            </div>
          </div>
        </Link>

        {/* زر تسجيل الدخول/الخروج */}
        <div className="flex items-center gap-2">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}