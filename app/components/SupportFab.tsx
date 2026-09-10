"use client";

import { usePathname } from "next/navigation";

export default function SupportFab() {
  const pathname = usePathname();

  // إخفاء الزر في صفحة الإدارة (اختياري)
  if (pathname.startsWith("/admin")) return null;

  const whatsapp = "201095432213"; // عدّل رقمك (مثال مصر: 20xxxxxxxxxx)

  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "مرحبًا، محتاج مساعدة في منصة مِسك"
  )}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed bottom-5 left-5 z-50
        rounded-full bg-slate-900 text-white
        px-4 py-3 text-sm font-semibold
        shadow-lg hover:bg-slate-800
        border border-slate-700
      "
    >
      دعم واتساب
    </a>
  );
}