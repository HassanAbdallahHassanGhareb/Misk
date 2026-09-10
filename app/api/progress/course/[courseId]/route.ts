import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("lesson_completions")
    .select("unit_id, lesson_id")
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const map: Record<string, number> = {};
  for (const r of rows ?? []) {
    map[r.unit_id] = (map[r.unit_id] ?? 0) + 1;
  }

  return NextResponse.json({ ok: true, doneCountByUnit: map });
}