import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const userClient = await createUserClient();
  const { data } = await userClient.auth.getUser();
  const user = data.user;

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!user) {
    return NextResponse.json({ ok: false, error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }

  if (!allowed.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ ok: false, error: "عذرًا، هذا الإيميل ليس لديه صلاحيات أدمن" }, { status: 403 });
  }

  const supabase = supabaseAdmin();
  const body = await req.json();
  const { action, payload } = body as { action: string; payload: any };

  try {
    // ---------- GRADES ----------
    if (action === "upsert_grade") {
      const { slug, name, order_index } = payload;
      const { data, error } = await supabase
        .from("grades")
        .upsert({ slug, name, order_index: Number(order_index) || 1 }, { onConflict: "slug" })
        .select("slug, name, order_index")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete_grade") {
      const { slug } = payload;
      const { error } = await supabase.from("grades").delete().eq("slug", slug);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { deleted: true } });
    }

    if (action === "delete_grade_force") {
      const { slug } = payload;
      const { count: coursesDeleted, error: delCoursesErr } = await supabase
        .from("courses")
        .delete({ count: "exact" })
        .eq("grade", slug);
      if (delCoursesErr) throw delCoursesErr;

      const { error: delGradeErr } = await supabase.from("grades").delete().eq("slug", slug);
      if (delGradeErr) throw delGradeErr;

      return NextResponse.json({ ok: true, data: { deleted: true, coursesDeleted: coursesDeleted ?? 0 } });
    }

    // ---------- TRACKS ----------
    if (action === "upsert_track") {
      const { slug, name, description, order_index } = payload;
      const { data, error } = await supabase
        .from("tracks")
        .upsert(
          { slug, name, description: description ?? "", order_index: Number(order_index) || 1 },
          { onConflict: "slug" }
        )
        .select("slug, name, description, order_index")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete_track") {
      const { slug } = payload;
      const { error } = await supabase.from("tracks").delete().eq("slug", slug);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { deleted: true } });
    }

    if (action === "delete_track_force") {
      const { slug } = payload;
      const { count: coursesDeleted, error: delCoursesErr } = await supabase
        .from("courses")
        .delete({ count: "exact" })
        .eq("track_slug", slug);
      if (delCoursesErr) throw delCoursesErr;

      const { error: delTrackErr } = await supabase.from("tracks").delete().eq("slug", slug);
      if (delTrackErr) throw delTrackErr;

      return NextResponse.json({ ok: true, data: { deleted: true, coursesDeleted: coursesDeleted ?? 0 } });
    }

    // ---------- COURSES ----------
    if (action === "create_course") {
      const { course_type, grade_slug, track_slug, title, subject } = payload;
      const row =
        course_type === "track"
          ? { course_type: "track", grade: null, track_slug, title, subject }
          : { course_type: "grade", grade: grade_slug, track_slug: null, title, subject };

      const { data: course, error } = await supabase
        .from("courses")
        .insert(row)
        .select("id, course_type, grade, track_slug, title, subject")
        .single();

      if (error) throw error;

      await supabase.from("course_terms").upsert(
        [
          { course_id: course.id, term: 1 },
          { course_id: course.id, term: 2 },
        ],
        { onConflict: "course_id,term" }
      );

      return NextResponse.json({ ok: true, data: course });
    }

    if (action === "update_course") {
      const { course_id, title, subject } = payload;
      const { data, error } = await supabase
        .from("courses")
        .update({ title, subject })
        .eq("id", course_id)
        .select("id, title, subject")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete_course") {
      const { course_id } = payload;
      const { error } = await supabase.from("courses").delete().eq("id", course_id);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { deleted: true } });
    }

    // ---------- TERM BOOK ----------
    if (action === "set_term_book") {
      const { course_id, term, book_pdf_url } = payload;
      const { data, error } = await supabase
        .from("course_terms")
        .upsert({ course_id, term, book_pdf_url }, { onConflict: "course_id,term" })
        .select("id, course_id, term, book_pdf_url")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    // ---------- UNITS ----------
    if (action === "create_unit") {
      const { course_id, term, order, title } = payload;
      const { data, error } = await supabase
        .from("units")
        .insert({ course_id, term, order, title })
        .select("id, course_id, term, order, title")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "update_unit") {
      const { unit_id, title, term, order } = payload;
      const { data, error } = await supabase
        .from("units")
        .update({ title, term, order })
        .eq("id", unit_id)
        .select("id, course_id, term, order, title")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "move_unit") {
      const { unit_id, direction } = payload as { unit_id: string; direction: -1 | 1 };

      const { data: unit, error: unitErr } = await supabase
        .from("units")
        .select("id, course_id, term, order")
        .eq("id", unit_id)
        .single();
      if (unitErr) throw unitErr;

      const query = supabase
        .from("units")
        .select("id, order")
        .eq("course_id", unit.course_id)
        .eq("term", unit.term);

      const { data: neighborList, error: nErr } =
        direction === -1
          ? await query.lt("order", unit.order).order("order", { ascending: false }).limit(1)
          : await query.gt("order", unit.order).order("order", { ascending: true }).limit(1);

      if (nErr) throw nErr;
      const neighbor = neighborList?.[0];
      if (!neighbor) return NextResponse.json({ ok: true, data: { moved: false } });

      const temp = -1000000;
      await supabase.from("units").update({ order: temp }).eq("id", neighbor.id);
      await supabase.from("units").update({ order: neighbor.order }).eq("id", unit.id);
      await supabase.from("units").update({ order: unit.order }).eq("id", neighbor.id);

      return NextResponse.json({ ok: true, data: { moved: true } });
    }

    if (action === "delete_unit") {
      const { unit_id } = payload;
      const { error } = await supabase.from("units").delete().eq("id", unit_id);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { deleted: true } });
    }

    // ---------- LESSONS ----------
    if (action === "create_lesson") {
      const { unit_id, order, title, youtube_id, summary, key_points, attachment_url } = payload;

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          unit_id,
          order,
          title,
          youtube_id: youtube_id || null,
          summary: summary || "",
          key_points: Array.isArray(key_points) ? key_points : [],
          attachment_url: attachment_url || null,
        })
        .select("id, unit_id, order, title, youtube_id, summary, key_points, attachment_url")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "update_lesson") {
      const { lesson_id, order, title, youtube_id, summary, key_points, attachment_url } = payload;

      const { data, error } = await supabase
        .from("lessons")
        .update({
          order,
          title,
          youtube_id: youtube_id || null,
          summary: summary || "",
          key_points: Array.isArray(key_points) ? key_points : [],
          attachment_url: attachment_url || null,
        })
        .eq("id", lesson_id)
        .select("id, unit_id, order, title, youtube_id, summary, key_points, attachment_url")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "move_lesson") {
      const { lesson_id, direction } = payload as { lesson_id: string; direction: -1 | 1 };

      const { data: lesson, error: lErr } = await supabase
        .from("lessons")
        .select("id, unit_id, order")
        .eq("id", lesson_id)
        .single();
      if (lErr) throw lErr;

      const query = supabase
        .from("lessons")
        .select("id, order")
        .eq("unit_id", lesson.unit_id);

      const { data: neighborList, error: nErr } =
        direction === -1
          ? await query.lt("order", lesson.order).order("order", { ascending: false }).limit(1)
          : await query.gt("order", lesson.order).order("order", { ascending: true }).limit(1);

      if (nErr) throw nErr;
      const neighbor = neighborList?.[0];
      if (!neighbor) return NextResponse.json({ ok: true, data: { moved: false } });

      const temp = -1000000;
      await supabase.from("lessons").update({ order: temp }).eq("id", neighbor.id);
      await supabase.from("lessons").update({ order: neighbor.order }).eq("id", lesson.id);
      await supabase.from("lessons").update({ order: lesson.order }).eq("id", neighbor.id);

      return NextResponse.json({ ok: true, data: { moved: true } });
    }

    if (action === "delete_lesson") {
      const { lesson_id } = payload;
      const { error } = await supabase.from("lessons").delete().eq("id", lesson_id);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { deleted: true } });
    }

    // ---------- QUESTIONS ----------
    if (action === "create_question") {
      const { lesson_id, qtype, question, choices, correct_index, correct_bool, explanation, order_index } = payload;

      const { data, error } = await supabase
        .from("quiz_questions")
        .insert({
          lesson_id,
          qtype,
          question,
          choices: qtype === "mcq" ? choices : null,
          correct_index: qtype === "mcq" ? correct_index : null,
          correct_bool: qtype === "tf" ? correct_bool : null,
          explanation: explanation || "",
          order_index: order_index ?? 1,
        })
        .select("id, lesson_id, qtype, order_index")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    // 🆕 تعديل السؤال
    if (action === "update_question") {
      const { question_id, qtype, question, choices, correct_index, correct_bool, explanation, order_index } = payload;

      const { data, error } = await supabase
        .from("quiz_questions")
        .update({
          qtype,
          question,
          choices: qtype === "mcq" ? choices : null,
          correct_index: qtype === "mcq" ? correct_index : null,
          correct_bool: qtype === "tf" ? correct_bool : null,
          explanation: explanation || "",
          order_index: order_index ?? 1,
        })
        .eq("id", question_id)
        .select("id, lesson_id, qtype, order_index")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete_question") {
      const { question_id } = payload;
      const { error } = await supabase.from("quiz_questions").delete().eq("id", question_id);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { deleted: true } });
    }

    return NextResponse.json({ ok: false, error: "أمر غير معروف" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "حدث خطأ غير متوقع" }, { status: 500 });
  }
}