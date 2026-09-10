"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getUnitProgress, isLessonDone } from "@/lib/progress";

type Unit = {
  id: string;
  title: string;
  lessons: { id: string; title: string; order?: number }[];
};

export default function UnitClient({
  courseId,
  courseSubject,
  unit,
}: {
  courseId: string;
  courseSubject: string;
  unit: Unit;
}) {
  const [serverLessonIds, setServerLessonIds] = useState<string[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/progress/unit/${unit.id}`, { cache: "no-store" });
        if (res.status === 401) {
          setServerLessonIds(null);
          return;
        }
        const json = await res.json();
        if (json.ok) setServerLessonIds(json.lessonIds ?? []);
        else setServerLessonIds(null);
      } catch {
        setServerLessonIds(null);
      }
    })();
  }, [unit.id]);

  const serverSet = useMemo(() => new Set(serverLessonIds ?? []), [serverLessonIds]);

  const doneCountServer = serverLessonIds ? serverLessonIds.length : null;
  const total = unit.lessons.length;

  const progress =
    doneCountServer !== null
      ? total > 0
        ? Math.min(1, doneCountServer / total)
        : 0
      : getUnitProgress(courseId, unit.id, total);

  const pct = Math.round(progress * 100);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link href={`/course/${courseId}`} className="text-sm text-slate-600 hover:underline">
        ← الرجوع للكورس
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold">{unit.title}</h1>
      <p className="mt-1 text-slate-600">{courseSubject}</p>

      <div className="mt-5 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">تقدم الوحدة</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden" dir="ltr">
          <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h2 className="mt-6 text-lg font-bold">الدروس</h2>
      <div className="mt-3 grid gap-3">
        {unit.lessons.map((l) => {
          const done =
            (serverLessonIds ? serverSet.has(l.id) : false) ||
            isLessonDone(courseId, unit.id, l.id);

          return (
            <Link
              key={l.id}
              href={`/course/${courseId}/unit/${unit.id}/lesson/${l.id}`}
              className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:border-slate-300 flex items-center justify-between"
            >
              <div>
                <div className="font-bold">{l.title}</div>
                <div className="mt-1 text-sm text-slate-600">فيديو + ملخص + اختبار</div>
              </div>

              {done && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </Link>
          );
        })}
      </div>
    </main>
  );
}