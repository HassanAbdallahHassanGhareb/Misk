"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isLessonDone, markLessonDone } from "@/lib/progress";

type QuizQuestion =
  | {
      id: string;
      type: "mcq";
      question: string;
      choices: string[];
      correctIndex: number;
      explanation?: string;
    }
  | {
      id: string;
      type: "tf";
      question: string;
      correctBool: boolean;
      explanation?: string;
    };

type LessonView = {
  id: string;
  title: string;
  youtubeId: string;
  summary: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
};

const PASS_PERCENT = 0.6; // 60% نجاح

export default function LessonClient({
  courseId,
  unitId,
  lesson,
  nextHref,
  prevHref,
}: {
  courseId: string;
  unitId: string;
  lesson: LessonView;
  nextHref: string | null;
  prevHref: string | null;
}) {
  const router = useRouter();

  // Done
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDone(isLessonDone(courseId, unitId, lesson.id));
  }, [courseId, unitId, lesson.id]);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, number | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizMsg, setQuizMsg] = useState<string | null>(null);

  const hasQuiz = lesson.quiz.length > 0;

  const allAnswered = useMemo(() => {
    if (!hasQuiz) return true;
    return lesson.quiz.every((q) => answers[q.id] !== undefined);
  }, [hasQuiz, lesson.quiz, answers]);

  const score = useMemo(() => {
    if (!submitted || !hasQuiz) return null;

    let correct = 0;
    for (const q of lesson.quiz) {
      const a = answers[q.id];
      if (q.type === "mcq") {
        if (typeof a === "number" && a === q.correctIndex) correct++;
      } else {
        if (typeof a === "boolean" && a === q.correctBool) correct++;
      }
    }

    return {
      correct,
      total: lesson.quiz.length,
      percent: lesson.quiz.length ? correct / lesson.quiz.length : 0,
    };
  }, [submitted, hasQuiz, answers, lesson.quiz]);

  const passed = useMemo(() => {
    if (!hasQuiz) return true;
    if (!submitted || !score) return false;
    return score.percent >= PASS_PERCENT;
  }, [hasQuiz, submitted, score]);

  const canFinish = useMemo(() => {
    if (!hasQuiz) return true;
    return allAnswered && submitted && passed;
  }, [hasQuiz, allAnswered, submitted, passed]);

  function submitQuiz() {
    if (!hasQuiz) return;
    if (!allAnswered) {
      setQuizMsg("لازم تجاوب على كل الأسئلة الأول.");
      return;
    }
    setQuizMsg(null);
    setSubmitted(true);
  }

  async function finishLesson() {
    if (!canFinish) {
      setQuizMsg("لازم تكمّل الاختبار وتنجح عشان تقدر تنهي الدرس.");
      return;
    }

    setSaving(true);

    // 1) save to Supabase (if logged in)
    try {
      await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          unit_id: unitId,
          lesson_id: lesson.id,
          done: true,
        }),
      });
    } catch {
      // ignore
    }

    // 2) local fallback
    markLessonDone(courseId, unitId, lesson.id, true);
    setDone(true);

    // 3) navigate
    const target = nextHref ?? `/course/${courseId}/unit/${unitId}`;
    router.push(target);
    router.refresh();

    setSaving(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/course/${courseId}/unit/${unitId}`}
          className="text-sm text-slate-600 hover:underline"
        >
          ← الرجوع للوحدة
        </Link>

        <div className="flex items-center gap-2">
          {prevHref && (
            <Link
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              href={prevHref}
            >
              السابق
            </Link>
          )}
          {nextHref && (
            <Link
              className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm"
              href={nextHref}
            >
              الدرس التالي
            </Link>
          )}
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-extrabold">{lesson.title}</h1>

      <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-black">
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <h2 className="font-bold">📄 ملخص الدرس</h2>
        <p className="mt-2 text-slate-700 leading-7">{lesson.summary}</p>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <h2 className="font-bold">💡 نقاط مهمة</h2>
        <ul className="mt-2 list-disc pr-6 text-slate-700">
          {lesson.keyPoints.map((k, i) => (
            <li key={i} className="mt-1">
              {k}
            </li>
          ))}
        </ul>
      </section>

      {/* Quiz */}
      <section className="mt-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <h2 className="font-bold">📝 اختبار</h2>

        {!hasQuiz ? (
          <p className="mt-2 text-slate-600">لا يوجد أسئلة لهذا الدرس حاليًا.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {lesson.quiz.map((q, idx) => {
              const userAns = answers[q.id];
              const showResult = submitted;

              return (
                <div key={q.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="font-semibold">
                    {idx + 1}) {q.question}
                  </div>

                  {q.type === "mcq" && (
                    <div className="mt-2 grid gap-2">
                      {q.choices.map((c, i) => {
                        const selected = userAns === i;
                        const correct = showResult && i === q.correctIndex;
                        const wrongSelected = showResult && selected && i !== q.correctIndex;

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSubmitted(false);
                              setQuizMsg(null);
                              setAnswers((prev) => ({ ...prev, [q.id]: i }));
                            }}
                            className={[
                              "text-right rounded-xl border px-3 py-2",
                              selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
                              correct ? "border-green-600 bg-green-50" : "",
                              wrongSelected ? "border-red-600 bg-red-50" : "",
                            ].join(" ")}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "tf" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        { label: "صح", value: true },
                        { label: "غلط", value: false },
                      ].map((opt) => {
                        const selected = userAns === opt.value;
                        const correct = showResult && opt.value === q.correctBool;
                        const wrongSelected = showResult && selected && opt.value !== q.correctBool;

                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => {
                              setSubmitted(false);
                              setQuizMsg(null);
                              setAnswers((prev) => ({ ...prev, [q.id]: opt.value }));
                            }}
                            className={[
                              "rounded-xl border px-3 py-2",
                              selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
                              correct ? "border-green-600 bg-green-50" : "",
                              wrongSelected ? "border-red-600 bg-red-50" : "",
                            ].join(" ")}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {submitted && q.explanation && (
                    <p className="mt-2 text-sm text-slate-600">شرح: {q.explanation}</p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={submitQuiz}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
              >
                تأكيد الإجابات
              </button>

              {score && (
                <span className={"text-sm font-semibold " + (passed ? "text-green-700" : "text-red-700")}>
                  النتيجة: {score.correct} / {score.total} ({Math.round(score.percent * 100)}%)
                </span>
              )}
            </div>

            {quizMsg && <p className="text-sm text-red-700">{quizMsg}</p>}
            {submitted && !passed && (
              <p className="text-sm text-slate-600">
                لازم تجيب على الأقل {Math.round(PASS_PERCENT * 100)}% عشان تقدر تنهي الدرس. غيّر إجاباتك وجرّب تاني.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Finish */}
      <section className="mt-6 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={finishLesson}
          disabled={!canFinish || saving}
          className="w-full rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "جارٍ الحفظ..." : done ? "تم ✅" : nextHref ? "إنهاء الدرس → التالي" : "إنهاء الدرس"}
        </button>

        {!canFinish && hasQuiz && (
          <p className="mt-2 text-sm text-slate-600">لازم تكمل الاختبار وتنجح الأول عشان زر إنهاء الدرس يتفعّل.</p>
        )}
      </section>
    </main>
  );
}