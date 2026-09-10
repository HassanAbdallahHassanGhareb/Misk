"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AuthButton() {
  const supabase = createClient();

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) return null;

  if (!email) {
    return (
      <Link className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm" href="/login">
        تسجيل الدخول
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="rounded-xl border bg-white px-3 py-2 text-sm"
      onClick={async () => {
        await supabase.auth.signOut();
        // انتقال مضمون + تحديث كامل للواجهة
        window.location.href = "/";
      }}
    >
      خروج ({email})
    </button>
  );
}