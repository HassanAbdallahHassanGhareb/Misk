"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginClient() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl = searchParams.get("next") || "/";

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function signUp() {
    setMsg("...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    setMsg("تم إنشاء الحساب ✅");
  }

  async function signIn() {
    setMsg("...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    const isAdmin = adminEmails.includes(email.trim().toLowerCase());

    setMsg("تم تسجيل الدخول ✅");
    router.push(isAdmin ? "/admin" : nextUrl);
    router.refresh();
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

        <button onClick={signIn} className="rounded-xl bg-slate-900 text-white px-4 py-2">
          دخول
        </button>

        <button onClick={signUp} className="rounded-xl border bg-white px-4 py-2">
          إنشاء حساب
        </button>

        {msg && <p className="text-sm text-slate-700">{msg}</p>}
      </div>
    </main>
  );
}