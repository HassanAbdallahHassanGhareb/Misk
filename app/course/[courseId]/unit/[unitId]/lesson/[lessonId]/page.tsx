import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import LessonClient from "@/app/components/LessonClient";

type QuizRow = {
  id: string;
  qtype: "mcq" | "tf";
  question: string;
  choices: string[] | null;
  correct_index: number | null;
  correct_bool: boolean | null;
  explanation: string;
  order_index: number;
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; unitId: string; lessonId: string }>;
}) {
  const { courseId, unitId, lessonId } = await params;
  const supabase = supabaseServer();

  // تأكد الوحدة تبع الكورس
  const { data: unit } = await supabase
    .from("units")
    .select("id, course_id")
    .eq("id", unitId)
    .single();

  if (!unit || unit.course_id !== courseId) notFound();

  // هات كل دروس الوحدة مرتبة (للسابق/التالي)
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, youtube_id, summary, key_points, order")
    .eq("unit_id", unitId)
    .order("order", { ascending: true });

  if (!lessons) notFound();

  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) notFound();

  const lesson = lessons[idx];
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const prevHref = prev ? `/course/${courseId}/unit/${unitId}/lesson/${prev.id}` : null;
  const nextHref = next ? `/course/${courseId}/unit/${unitId}/lesson/${next.id}` : null;

  // هات أسئلة الدرس
  const { data: quizRows } = await supabase
    .from("quiz_questions")
    .select("id,qtype,question,choices,correct_index,correct_bool,explanation,order_index")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  const quiz = (quizRows as QuizRow[] | null)?.map((q) => ({
    id: q.id,
    type: q.qtype,
    question: q.question,
    choices: q.choices ?? undefined,
    correctIndex: q.correct_index ?? undefined,
    correctBool: q.correct_bool ?? undefined,
    explanation: q.explanation ?? "",
  })) ?? [];

  return (
    <LessonClient
      courseId={courseId}
      unitId={unitId}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        youtubeId: lesson.youtube_id ?? "",
        summary: lesson.summary ?? "",
        keyPoints: lesson.key_points ?? [],
        quiz,
      }}
      prevHref={prevHref}
      nextHref={nextHref}
    />
  );
}