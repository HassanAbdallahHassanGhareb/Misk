"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginClient() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const nextUrl = searchParams.get("next") || "/";

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email || !password) {
      setMsg("اكتب الإيميل وكلمة المرور أولاً.");
      return;
    }
    setMsg("...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("تم إنشاء الحساب ✅، يمكنك الآن تسجيل الدخول.");
  }

  async function signIn() {
    if (loading) return;

    if (!email || !password) {
      setMsg("اكتب الإيميل وكلمة المرور أولاً.");
      return;
    }

    setLoading(true);
    setMsg("جارٍ تسجيل الدخول...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    const isAdmin = adminEmails.includes(email.trim().toLowerCase());
    const target = isAdmin ? "/admin" : nextUrl;

    setMsg("تم تسجيل الدخول ✅، جاري التحويل...");

    // ✅ السطر ده هو اللي بيحل مشكلة فيرسيل والـ Cookies مع السيرفر
    window.location.href = target;
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← رجوع
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold">تسجيل الدخول</h1>

      <div className="mt-4 grid gap-2 rounded-2xl bg-white border p-4">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signIn}
          disabled={loading}
          className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>

        <button onClick={signUp} className="rounded-xl border bg-white px-4 py-2">
          إنشاء حساب
        </button>

        {msg && <p className="text-sm text-slate-700">{msg}</p>}
      </div>
    </main>
  );
}