import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json();
  const { course_id, unit_id, lesson_id, done } = body as {
    course_id: string;
    unit_id: string;
    lesson_id: string;
    done: boolean;
  };

  if (!course_id || !unit_id || !lesson_id) {
    return NextResponse.json({ ok: false, error: "Missing ids" }, { status: 400 });
  }

  if (done) {
    const { error } = await supabase
      .from("lesson_completions")
      .upsert(
        { user_id: user.id, course_id, unit_id, lesson_id },
        { onConflict: "user_id,lesson_id" }
      );

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } else {
    const { error } = await supabase
      .from("lesson_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lesson_id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
}