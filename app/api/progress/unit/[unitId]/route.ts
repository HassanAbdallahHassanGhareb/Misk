import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("unit_id", unitId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, lessonIds: (rows ?? []).map((r) => r.lesson_id) });
}