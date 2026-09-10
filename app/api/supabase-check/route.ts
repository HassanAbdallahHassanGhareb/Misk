import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    const body = await res.text();
    return NextResponse.json({ ok: res.ok, status: res.status, body });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "fetch failed" }, { status: 500 });
  }
}