"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen } from "lucide-react";
import AuthButton from "@/app/components/AuthButton";
import { getUnitProgress } from "@/lib/progress";
import { createClient } from "@/utils/supabase/client";

type Grade = "prep3" | "sec1" | "sec2";
type Term = 1 | 2;
type GradeRow = { slug: string; name: string; order_index: number };
type CourseTermRow = { id: string; term: Term; book_pdf_url: string | null };
type UnitRow = { id: string; title: string; term: Term; order: number; lessons: { id: string }[] };
type TrackRel = { slug: string; name: string; description: string; order_index: number } | null;

type CourseRow = {
  id: string;
  course_type: "grade" | "track";
  grade: string | null;
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr(null);
        const [gRes, cRes] = await Promise.all([
          fetch("/api/grades", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
        ]);
        const gJson = await gRes.json();
        const cJson = await cRes.json();
        if (!gJson.ok || !cJson.ok) throw new Error("فشل تحميل البيانات");
        setGrades(gJson.data);
        setCourses(cJson.data);
      } catch (e: any) { setErr(e?.message ?? "Error"); } finally { setLoading(false); }
    })();
  }, []);

  const gradeCourse = useMemo(() => {
    if (!selectedGradeSlug || !courses) return null;
    return courses.find((c) => c.course_type === "grade" && c.grade === selectedGradeSlug) ?? null;
  }, [selectedGradeSlug, courses]);

  const trackCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => c.course_type === "track").sort((a, b) => (a.tracks?.order_index ?? 99) - (b.tracks?.order_index ?? 99));
  }, [courses]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId || !courses) return null;
    return courses.find((c) => c.id === selectedCourseId) ?? null;
  }, [selectedCourseId, courses]);

  const currentCourse = mode === "grades" ? gradeCourse : selectedCourse;
  const isGradeCourse = currentCourse?.course_type === "grade";

  useEffect(() => {
    (async () => {
      if (!currentCourse?.id || !loggedIn) return setDoneCountByUnit(null);
      try {
        const res = await fetch(`/api/progress/course/${currentCourse.id}`, { cache: "no-store" });
        const json = await res.json();
        setDoneCountByUnit(json.ok ? (json.doneCountByUnit ?? {}) : null);
      } catch { setDoneCountByUnit(null); }
    })();
  }, [currentCourse?.id, loggedIn]);

  const courseBookUrl = useMemo(() => {
    if (!currentCourse) return null;
    if (currentCourse.course_type === "grade") {
      const row = (currentCourse.course_terms ?? []).find((t) => t.term === term);
      return row?.book_pdf_url ?? null;
    } else {
      const row = (currentCourse.course_terms ?? []).find((t) => !!t.book_pdf_url);
      return row?.book_pdf_url ?? null;
    }
  }, [currentCourse, term]);

  const unitsToShow = useMemo(() => {
    if (!currentCourse) return [];
    const all = [...(currentCourse.units ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return currentCourse.course_type === "grade" ? all.filter((u) => (u.term ?? 1) === term) : all;
  }, [currentCourse, term]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">


      <div className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white p-1">
        <button onClick={() => { setMode("grades"); localStorage.setItem("misk_mode2", "grades"); }} className={"rounded-2xl px-4 py-2 text-sm font-semibold " + (mode === "grades" ? "bg-slate-900 text-white" : "text-slate-700")}>
          الصفوف المدرسية
        </button>
        <button onClick={() => { setMode("courses"); localStorage.setItem("misk_mode2", "courses"); }} className={"rounded-2xl px-4 py-2 text-sm font-semibold " + (mode === "courses" ? "bg-slate-900 text-white" : "text-slate-700")}>
          الكورسات العامة
        </button>
      </div>

      <header className="mt-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold">مرحبًا بك في منصة مِسك</h1>
        <p className="mt-2 text-slate-600">اتعلم • طبّق • اختبر</p>
      </header>

      {loading && <div className="mt-4 text-slate-600">جاري التحميل...</div>}

      {/* GRADES */}
      {mode === "grades" && !loading && (
        <section className="mt-6">
          <h2 className="text-lg font-bold mb-3">اختر صفك الدراسي</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {grades.map((g) => (
              <button key={g.slug} onClick={() => { setSelectedGradeSlug(g.slug); localStorage.setItem("misk_grade_slug", g.slug); }} className={"flex items-center justify-between rounded-2xl bg-white p-4 border shadow-sm transition " + (selectedGradeSlug === g.slug ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200")}>
                <div className="text-right">
                  <div className="font-bold">{g.name}</div>
                </div>
                <GraduationCap className="h-6 w-6 text-slate-700" />
              </button>
            ))}
          </div>
          {selectedGradeSlug && !gradeCourse && <div className="mt-3 text-slate-600">لم يتم إضافة محتوى لهذا الصف بعد.</div>}
        </section>
      )}

      {/* TRACKS */}
      {mode === "courses" && !loading && (
        <section className="mt-6">
          <h2 className="text-lg font-bold mb-3">الكورسات المتاحة</h2>
          {trackCourses.length === 0 ? (
            <div className="text-slate-600">لا توجد كورسات عامة متاحة حاليًا.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {trackCourses.map((c) => (
                <button key={c.id} onClick={() => { setSelectedCourseId(c.id); localStorage.setItem("misk_selected_course", c.id); }} className={"rounded-2xl bg-white p-4 border shadow-sm text-right flex items-center justify-between " + (selectedCourseId === c.id ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200")}>
                  <div>
                    <div className="font-bold text-lg">{c.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{c.subject}</div>
                  </div>
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CONTENT DISPLAY */}
      {currentCourse && !loading && (
        <section className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xl font-extrabold text-slate-800 mb-4">📚 محتوى: {currentCourse.subject}</h3>

          {isGradeCourse ? (
            <div className="mb-6 space-y-3">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
                <button onClick={() => setTerm(1)} className={"rounded-2xl px-4 py-2 text-sm font-semibold " + (term === 1 ? "bg-slate-900 text-white" : "text-slate-700")}>الفصل الدراسي الأول</button>
                <button onClick={() => setTerm(2)} className={"rounded-2xl px-4 py-2 text-sm font-semibold " + (term === 2 ? "bg-slate-900 text-white" : "text-slate-700")}>الفصل الدراسي الثاني</button>
              </div>
              {courseBookUrl && (
                <div>
                  <a href={courseBookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl bg-blue-600 text-white px-5 py-2 text-sm font-bold hover:bg-blue-700">
                    📄 تحميل كتاب الترم (PDF)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              {courseBookUrl && (
                <a href={courseBookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl bg-blue-600 text-white px-5 py-2 text-sm font-bold hover:bg-blue-700">
                  📄 تحميل كتاب / مذكرة الكورس (PDF)
                </a>
              )}
            </div>
          )}

          {unitsToShow.length === 0 ? (
            <p className="text-slate-600">لا توجد وحدات بعد.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {unitsToShow.map((u) => {
                const total = u.lessons?.length ?? 0;
                const p = total > 0 ? (doneCountByUnit ? (doneCountByUnit[u.id] ?? 0) / total : getUnitProgress(currentCourse.id, u.id, total)) : 0;
                const pct = Math.round(p * 100);

                return (
                  <div key={u.id} className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-lg text-slate-800">{u.title}</div>
                      <div className="mt-2 text-sm text-slate-500 font-semibold">{total} دروس متاحة</div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>نسبة الإنجاز</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden" dir="ltr">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <button onClick={() => router.push(`/course/${currentCourse.id}/unit/${u.id}`)} className="mt-4 w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-bold hover:bg-slate-800 transition">
                        بدء التعلم
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}