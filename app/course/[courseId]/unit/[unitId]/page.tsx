import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import UnitClient from "@/app/components/UnitClient";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ courseId: string; unitId: string }>;
}) {
  const { courseId, unitId } = await params;
  const supabase = supabaseServer();

  // هات الكورس عشان subject
  const { data: course } = await supabase
    .from("courses")
    .select("id, subject")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  // هات الوحدة ودروسها (وتأكد إنها تبع الكورس)
  const { data: unit, error } = await supabase
    .from("units")
    .select(`id, course_id, title, order, lessons ( id, title, order )`)
    .eq("id", unitId)
    .eq("course_id", courseId)
    .single();

  if (error || !unit) notFound();

  // ترتيب الدروس
  const lessonsSorted = [...(unit.lessons ?? [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <UnitClient
      courseId={course.id}
      courseSubject={course.subject}
      unit={{ ...unit, lessons: lessonsSorted }}
    />
  );
}