import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing Supabase env vars" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id, course_type, grade, track_slug, title, subject,
      tracks ( slug, name, description, order_index ),
      course_terms ( id, term, book_pdf_url ),
      units (
        id, title, term, order,
        lessons ( id, title, order )
      )
    `);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: courses ?? [] });
}