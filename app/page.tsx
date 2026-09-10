"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import AuthButton from "@/app/components/AuthButton";
import { getUnitProgress } from "@/lib/progress";
import { createClient } from "@/utils/supabase/client";

type Term = 1 | 2;

type GradeRow = { slug: string; name: string; order_index: number };

type CourseTermRow = { id: string; term: Term; book_pdf_url: string | null };
type UnitRow = { id: string; title: string; term: Term; order: number; lessons: { id: string }[] };

type TrackRel = { slug: string; name: string; description: string; order_index: number } | null;

type CourseRow = {
  id: string;
  course_type: "grade" | "track";
  grade: string | null; // grade slug
  track_slug: string | null;
  title: string;
  subject: string;
  tracks: TrackRel;
  course_terms: CourseTermRow[];
  units: UnitRow[];
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"grades" | "courses">("grades");
  const [term, setTerm] = useState<Term>(1);

  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [selectedGradeSlug, setSelectedGradeSlug] = useState<string>("");

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [courses, setCourses] = useState<CourseRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // لتقليل 401 spam: ما نطلبش progress من السيرفر إلا لو logged in
  const [loggedIn, setLoggedIn] = useState(false);
  const [doneCountByUnit, setDoneCountByUnit] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("misk_mode2") as "grades" | "courses" | null;
    if (savedMode) setMode(savedMode);

    const savedGrade = localStorage.getItem("misk_grade_slug") || "";
    if (savedGrade) setSelectedGradeSlug(savedGrade);

    const savedCourseId = localStorage.getItem("misk_selected_course") || "";
    if (savedCourseId) setSelectedCourseId(savedCourseId);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(!!data.user);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [gRes, cRes] = await Promise.all([
          fetch("/api/grades", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
        ]);

        const gJson = await gRes.json();
        const cJson = await cRes.json();

        if (!gJson.ok) throw new Error(gJson.error || "Failed to load grades");
        if (!cJson.ok) throw new Error(cJson.error || "Failed to load courses");

        setGrades(gJson.data as GradeRow[]);
        setCourses(cJson.data as CourseRow[]);
      } catch (e: any) {
        setErr(e?.message ?? "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const gradeCourse = useMemo(() => {
    if (!selectedGradeSlug || !courses) return null;
    return courses.find((c) => c.course_type === "grade" && c.grade === selectedGradeSlug) ?? null;
  }, [selectedGradeSlug, courses]);

  const trackCourses = useMemo(() => {
    if (!courses) return [];
    return courses
      .filter((c) => c.course_type === "track")
      .sort((a, b) => (a.tracks?.order_index ?? 999) - (b.tracks?.order_index ?? 999));
  }, [courses]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId || !courses) return null;
    return courses.find((c) => c.id === selectedCourseId) ?? null;
  }, [selectedCourseId, courses]);

  const currentCourse = mode === "grades" ? gradeCourse : selectedCourse;
  const isGradeCourse = currentCourse?.course_type === "grade";

  // progress from supabase (only when logged in)
  useEffect(() => {
    (async () => {
      if (!currentCourse?.id) {
        setDoneCountByUnit(null);
        return;
      }
      if (!loggedIn) {
        setDoneCountByUnit(null);
        return;
      }
      try {
        const res = await fetch(`/api/progress/course/${currentCourse.id}`, { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setDoneCountByUnit(json.doneCountByUnit ?? {});
        else setDoneCountByUnit(null);
      } catch {
        setDoneCountByUnit(null);
      }
    })();
  }, [currentCourse?.id, loggedIn]);

  const termBookUrl = useMemo(() => {
    if (!currentCourse || !isGradeCourse) return null;
    const row = (currentCourse.course_terms ?? []).find((t) => t.term === term) ?? null;
    return row?.book_pdf_url ?? null;
  }, [currentCourse, term, isGradeCourse]);

  const unitsToShow = useMemo(() => {
    if (!currentCourse) return [];
    const all = [...(currentCourse.units ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (currentCourse.course_type === "grade") return all.filter((u) => (u.term ?? 1) === term);
    return all;
  }, [currentCourse, term]);

  function unitProgress(courseId: string, unit: UnitRow) {
    const total = unit.lessons?.length ?? 0;
    if (total <= 0) return 0;

    if (doneCountByUnit) {
      const done = doneCountByUnit[unit.id] ?? 0;
      return Math.min(1, done / total);
    }

    return getUnitProgress(courseId, unit.id, total);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">


   

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => {
            setMode("grades");
            localStorage.setItem("misk_mode2", "grades");
          }}
          className={"rounded-2xl px-4 py-2 text-sm " + (mode === "grades" ? "bg-slate-900 text-white" : "text-slate-700")}
        >
          الصفوف
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("courses");
            localStorage.setItem("misk_mode2", "courses");
          }}
          className={"rounded-2xl px-4 py-2 text-sm " + (mode === "courses" ? "bg-slate-900 text-white" : "text-slate-700")}
        >
          كورسات
        </button>
      </div>

      {loading && <div className="mt-4 text-slate-600">تحميل...</div>}
      {err && <div className="mt-4 text-red-700">{err}</div>}

      {/* Grades */}
      {mode === "grades" && !loading && (
        <section className="mt-6">
          <h2 className="text-lg font-bold mb-3">اختر صفك</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {grades.map((g) => (
              <button
                key={g.slug}
                onClick={() => {
                  setSelectedGradeSlug(g.slug);
                  localStorage.setItem("misk_grade_slug", g.slug);
                }}
                className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition"
              >
                <div className="text-right">
                  <div className="font-bold">{g.name}</div>
                  <div className="text-slate-600 text-sm mt-1">({g.slug})</div>
                </div>
                <GraduationCap className="h-6 w-6 text-slate-700" />
              </button>
            ))}
          </div>

          {selectedGradeSlug && !gradeCourse && (
            <div className="mt-3 text-slate-600">
              اخترت صف: <b>{selectedGradeSlug}</b> لكن لم يتم إنشاء كورس لهذا الصف بعد (من الأدمن).
            </div>
          )}
        </section>
      )}

      {/* Courses (tracks) */}
      {mode === "courses" && !loading && (
        <section className="mt-6">
          <h2 className="text-lg font-bold mb-3">اختر كورس</h2>

          {trackCourses.length === 0 ? (
            <div className="text-slate-600">لا توجد كورسات Track بعد (اعمل Track + Course type=track من الأدمن).</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {trackCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCourseId(c.id);
                    localStorage.setItem("misk_selected_course", c.id);
                  }}
                  className={
                    "rounded-2xl bg-white p-4 border shadow-sm text-right hover:border-slate-300 " +
                    (selectedCourseId === c.id ? "border-slate-900" : "border-slate-200")
                  }
                >
                  <div className="font-bold">{c.tracks?.name ?? c.subject}</div>
                  <div className="mt-1 text-sm text-slate-600">{c.subject}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Course view */}
      {currentCourse && !loading && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">📚 {currentCourse.subject}</h3>
          </div>

          {isGradeCourse && (
            <>
              <div className="mt-3 inline-flex rounded-2xl border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setTerm(1)}
                  className={"rounded-2xl px-4 py-2 text-sm " + (term === 1 ? "bg-slate-900 text-white" : "text-slate-700")}
                >
                  الفصل الدراسي الأول
                </button>
                <button
                  onClick={() => setTerm(2)}
                  className={"rounded-2xl px-4 py-2 text-sm " + (term === 2 ? "bg-slate-900 text-white" : "text-slate-700")}
                >
                  الفصل الدراسي الثاني
                </button>
              </div>

              <div className="mt-4">
                {termBookUrl ? (
                  <a
                    href={termBookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
                  >
                    كتاب الفصل الدراسي {term === 1 ? "الأول" : "الثاني"} (PDF)
                  </a>
                ) : (
                  <div className="text-sm text-slate-600">لا يوجد كتاب PDF لهذا الفصل حاليًا.</div>
                )}
              </div>
            </>
          )}

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {unitsToShow.map((u) => (
              <div key={u.id} className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
                <div className="font-bold text-base">{u.title}</div>
                <div className="mt-2 text-sm text-slate-600">{u.lessons?.length ?? 0} دروس</div>

                {(() => {
                  const p = unitProgress(currentCourse.id, u);
                  const pct = Math.round(p * 100);
                  return (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">التقدم</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden" dir="ltr">
                        <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => router.push(`/course/${currentCourse.id}/unit/${u.id}`)}
                  className="mt-4 w-full rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800"
                >
                  دخول الوحدة
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}