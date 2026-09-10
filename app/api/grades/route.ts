import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing env" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("grades")
    .select("slug,name,order_index")
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data: data ?? [] });
}