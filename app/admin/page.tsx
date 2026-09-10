"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type GradeRow = { slug: string; name: string; order_index: number };
type TrackRow = { slug: string; name: string; description: string; order_index: number };
type Term = 1 | 2;

type CourseRow = {
  id: string;
  course_type?: "grade" | "track";
  grade: string | null;
  track_slug?: string | null;
  title: string;
  subject: string;
  units?: {
    id: string;
    title: string;
    term: Term;
    order: number;
    lessons?: {
      id: string;
      title: string;
      order: number;
      youtube_id?: string | null;
      summary?: string;
      key_points?: string[];
    }[];
  }[];
};

type QuestionRow = {
  id: string;
  lesson_id: string;
  qtype: "mcq" | "tf";
  question: string;
  choices: string[] | null;
  correct_index: number | null;
  correct_bool: boolean | null;
  explanation: string;
  order_index: number;
};

async function adminPost(password: string, action: string, payload: any) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ adminPassword: password.trim(), action, payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
}

export default function AdminPage() {
  // auth
  const [passInput, setPassInput] = useState("");
  const [adminPass, setAdminPass] = useState<string>("");

  // data
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [msg, setMsg] = useState<string>("");

  // Grades form
  const [gSlug, setGSlug] = useState("sec3");
  const [gName, setGName] = useState("الصف الثالث الثانوي");
  const [gOrder, setGOrder] = useState<number>(4);

  // Tracks form
  const [tSlug, setTSlug] = useState("icdl");
  const [tName, setTName] = useState("ICDL");
  const [tDesc, setTDesc] = useState("");
  const [tOrder, setTOrder] = useState<number>(1);

  // create course
  const [courseType, setCourseType] = useState<"grade" | "track">("grade");
  const [courseGradeSlug, setCourseGradeSlug] = useState<string>("");
  const [courseTrackSlug, setCourseTrackSlug] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseSubject, setCourseSubject] = useState("");

  // select course
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // edit course
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseSubject, setEditCourseSubject] = useState("");

  // term book
  const [term, setTerm] = useState<Term>(1);
  const [termBookUrl, setTermBookUrl] = useState("");

  // create unit
  const [unitTerm, setUnitTerm] = useState<Term>(1);
  const [unitOrder, setUnitOrder] = useState<number>(1);
  const [unitTitle, setUnitTitle] = useState("");

  // select unit
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  // edit unit
  const [editUnitTitle, setEditUnitTitle] = useState("");
  const [editUnitOrder, setEditUnitOrder] = useState<number>(1);
  const [editUnitTerm, setEditUnitTerm] = useState<Term>(1);

  // create lesson
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [lessonTitle, setLessonTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");

  // select lesson
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

  // edit lesson
  const [editLessonOrder, setEditLessonOrder] = useState<number>(1);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editYoutubeId, setEditYoutubeId] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editKeyPointsText, setEditKeyPointsText] = useState("");

  // question create
  const [qType, setQType] = useState<"mcq" | "tf">("mcq");
  const [qOrder, setQOrder] = useState<number>(1);
  const [qText, setQText] = useState("");
  const [choicesText, setChoicesText] = useState("");
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [correctBool, setCorrectBool] = useState<boolean>(true);
  const [explanation, setExplanation] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const unitsOfCourse = useMemo(() => {
    const u = selectedCourse?.units ?? [];
    return [...u].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [selectedCourse]);

  const selectedUnit = useMemo(
    () => unitsOfCourse.find((u) => u.id === selectedUnitId) ?? null,
    [unitsOfCourse, selectedUnitId]
  );

  const lessonsOfUnit = useMemo(() => {
    const l = selectedUnit?.lessons ?? [];
    return [...l].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [selectedUnit]);

  const selectedLesson = useMemo(
    () => lessonsOfUnit.find((l) => l.id === selectedLessonId) ?? null,
    [lessonsOfUnit, selectedLessonId]
  );

  const gradeName = useMemo(() => {
    const map = new Map(grades.map((g) => [g.slug, g.name]));
    return (slug: string | null | undefined) => (slug ? map.get(slug) ?? slug : "");
  }, [grades]);

  async function refreshAll() {
    const g = await supabase.from("grades").select("slug,name,order_index").order("order_index");
    if (g.data) setGrades(g.data as any);

    const t = await supabase.from("tracks").select("slug,name,description,order_index").order("order_index");
    if (t.data) setTracks(t.data as any);

    const res = await fetch("/api/courses", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setCourses(json.data as CourseRow[]);
  }

  async function refreshQuestions(lessonId: string) {
    const q = await supabase
      .from("quiz_questions")
      .select("id,lesson_id,qtype,question,choices,correct_index,correct_bool,explanation,order_index")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });
    setQuestions((q.data ?? []) as any);
  }

  useEffect(() => {
    const p = (localStorage.getItem("misk_admin_pass") || "").trim();
    setAdminPass(p);
    refreshAll();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      setEditCourseTitle(selectedCourse.title ?? "");
      setEditCourseSubject(selectedCourse.subject ?? "");
    }
  }, [selectedCourseId]); // eslint-disable-line

  useEffect(() => {
    if (selectedUnit) {
      setEditUnitTitle(selectedUnit.title ?? "");
      setEditUnitOrder(selectedUnit.order ?? 1);
      setEditUnitTerm(selectedUnit.term ?? 1);
    }
  }, [selectedUnitId]); // eslint-disable-line

  useEffect(() => {
    setQuestions([]);
    if (selectedLesson) {
      setEditLessonTitle(selectedLesson.title ?? "");
      setEditLessonOrder(selectedLesson.order ?? 1);
      setEditYoutubeId(selectedLesson.youtube_id ?? "");
      setEditSummary(selectedLesson.summary ?? "");
      setEditKeyPointsText((selectedLesson.key_points ?? []).join("\n"));
    }
    if (selectedLessonId) refreshQuestions(selectedLessonId);
  }, [selectedLessonId]); // eslint-disable-line

  function savePass() {
    const p = passInput.trim();
    localStorage.setItem("misk_admin_pass", p);
    setAdminPass(p);
    setPassInput("");
    setMsg("تم تسجيل الدخول ✅");
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-extrabold">لوحة الإدارة (Admin)</h1>

      {/* Auth */}
      <section className="mt-4 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">دخول الأدمن</h2>

        {!adminPass ? (
          <div className="mt-2 grid gap-2">
            <input
              className="w-full border rounded-xl px-3 py-2"
              placeholder="ADMIN_PASSWORD"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              type="password"
            />
            <button className="rounded-xl bg-slate-900 text-white px-4 py-2" onClick={savePass}>
              حفظ كلمة السر على الجهاز
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-sm text-green-700 font-semibold">تم تسجيل الدخول ✅</div>
            <button
              className="rounded-xl border bg-white px-4 py-2 text-sm"
              onClick={() => {
                localStorage.removeItem("misk_admin_pass");
                setAdminPass("");
                setMsg("تم تسجيل الخروج");
              }}
            >
              تسجيل خروج
            </button>
          </div>
        )}

        {msg && <p className="mt-2 text-sm text-slate-700">{msg}</p>}
      </section>

      {/* Grades */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">0) إضافة مرحلة/صف (Grade)</h2>
        <div className="mt-3 grid gap-2">
          <input className="border rounded-xl px-3 py-2" value={gSlug} onChange={(e) => setGSlug(e.target.value.trim())} placeholder="slug مثال: sec3" />
          <input className="border rounded-xl px-3 py-2" value={gName} onChange={(e) => setGName(e.target.value)} placeholder="اسم الصف" />
          <input className="border rounded-xl px-3 py-2" type="number" value={gOrder} onChange={(e) => setGOrder(Number(e.target.value))} placeholder="ترتيب" />

          <button
            disabled={!adminPass}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            onClick={async () => {
              setMsg("...");
              try {
                await adminPost(adminPass, "upsert_grade", { slug: gSlug, name: gName, order_index: gOrder });
                setMsg("تم حفظ الصف ✅");
                await refreshAll();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            حفظ الصف
          </button>

          <div className="text-sm font-semibold mt-3">الصفوف الحالية:</div>
          <ul className="text-sm space-y-2">
            {grades.map((g) => (
              <li key={g.slug} className="border rounded-xl p-2 flex justify-between gap-2">
                <span>
                  {g.order_index}) {g.name} — <span className="font-mono">{g.slug}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={!adminPass}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      if (!confirm("حذف الصف؟ (سيفشل لو عليه كورسات)")) return;
                      setMsg("...");
                      try {
                        await adminPost(adminPass, "delete_grade", { slug: g.slug });
                        setMsg("تم حذف الصف ✅");
                        await refreshAll();
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    حذف
                  </button>
                  <button
                    disabled={!adminPass}
                    className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      if (!confirm("حذف إجباري؟ سيحذف كل كورسات الصف ومحتواها.")) return;
                      setMsg("...");
                      try {
                        const r = await adminPost(adminPass, "delete_grade_force", { slug: g.slug });
                        setMsg(`تم ✅ (حذف ${r.coursesDeleted ?? 0} كورس)`);
                        await refreshAll();
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    حذف إجباري
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tracks */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">0) إضافة كورس “كورسات” (Track)</h2>
        <div className="mt-3 grid gap-2">
          <input className="border rounded-xl px-3 py-2" value={tSlug} onChange={(e) => setTSlug(e.target.value.trim())} placeholder="slug مثال: icdl / excel" />
          <input className="border rounded-xl px-3 py-2" value={tName} onChange={(e) => setTName(e.target.value)} placeholder="اسم الكورس" />
          <textarea className="border rounded-xl px-3 py-2" value={tDesc} onChange={(e) => setTDesc(e.target.value)} placeholder="وصف (اختياري)" />
          <input className="border rounded-xl px-3 py-2" type="number" value={tOrder} onChange={(e) => setTOrder(Number(e.target.value))} placeholder="ترتيب" />

          <button
            disabled={!adminPass}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            onClick={async () => {
              setMsg("...");
              try {
                await adminPost(adminPass, "upsert_track", { slug: tSlug, name: tName, description: tDesc, order_index: tOrder });
                setMsg("تم حفظ الكورس (Track) ✅");
                await refreshAll();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            حفظ
          </button>

          <div className="text-sm font-semibold mt-3">الكورسات (Tracks) الحالية:</div>
          <ul className="text-sm space-y-2">
            {tracks.map((t) => (
              <li key={t.slug} className="border rounded-xl p-2 flex justify-between gap-2">
                <span>
                  {t.order_index}) {t.name} — <span className="font-mono">{t.slug}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={!adminPass}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      if (!confirm("حذف الكورس؟ (سيفشل لو عليه Course)")) return;
                      setMsg("...");
                      try {
                        await adminPost(adminPass, "delete_track", { slug: t.slug });
                        setMsg("تم حذف ✅");
                        await refreshAll();
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    حذف
                  </button>
                  <button
                    disabled={!adminPass}
                    className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      if (!confirm("حذف إجباري؟ سيحذف كل الكورسات التابعة لهذا Track.")) return;
                      setMsg("...");
                      try {
                        const r = await adminPost(adminPass, "delete_track_force", { slug: t.slug });
                        setMsg(`تم ✅ (حذف ${r.coursesDeleted ?? 0} كورس)`);
                        await refreshAll();
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    حذف إجباري
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Create course */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">1) إنشاء كورس (Course)</h2>

        <div className="mt-3 grid gap-2">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 w-fit">
            <button
              className={"rounded-2xl px-3 py-2 text-sm " + (courseType === "grade" ? "bg-slate-900 text-white" : "text-slate-700")}
              onClick={() => setCourseType("grade")}
              type="button"
            >
              كورس صف
            </button>
            <button
              className={"rounded-2xl px-3 py-2 text-sm " + (courseType === "track" ? "bg-slate-900 text-white" : "text-slate-700")}
              onClick={() => setCourseType("track")}
              type="button"
            >
              كورس كورسات (Track)
            </button>
          </div>

          {courseType === "grade" ? (
            <select className="border rounded-xl px-3 py-2" value={courseGradeSlug} onChange={(e) => setCourseGradeSlug(e.target.value)}>
              <option value="">-- اختر الصف --</option>
              {grades.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <select className="border rounded-xl px-3 py-2" value={courseTrackSlug} onChange={(e) => setCourseTrackSlug(e.target.value)}>
              <option value="">-- اختر الكورس (Track) --</option>
              {tracks.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <input className="border rounded-xl px-3 py-2" placeholder="Title" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Subject" value={courseSubject} onChange={(e) => setCourseSubject(e.target.value)} />

          <button
            disabled={
              !adminPass ||
              !courseTitle ||
              !courseSubject ||
              (courseType === "grade" ? !courseGradeSlug : !courseTrackSlug)
            }
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            onClick={async () => {
              setMsg("...");
              try {
                const data = await adminPost(adminPass, "create_course", {
                  course_type: courseType,
                  grade_slug: courseType === "grade" ? courseGradeSlug : null,
                  track_slug: courseType === "track" ? courseTrackSlug : null,
                  title: courseTitle,
                  subject: courseSubject,
                });

                setMsg("تم إنشاء الكورس ✅");
                setSelectedCourseId(data.id);
                setCourseTitle("");
                setCourseSubject("");
                await refreshAll();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            إنشاء
          </button>
        </div>
      </section>

      {/* Select course + edit + delete */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">2) اختر كورس + تعديل/حذف</h2>

        <select
          className="mt-3 w-full border rounded-xl px-3 py-2"
          value={selectedCourseId}
          onChange={(e) => {
            setSelectedCourseId(e.target.value);
            setSelectedUnitId("");
            setSelectedLessonId("");
            setQuestions([]);
          }}
        >
          <option value="">-- اختر كورس --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course_type === "track"
                ? `كورسات: ${c.track_slug ?? ""} | ${c.subject}`
                : `صف: ${gradeName(c.grade)} | ${c.subject}`}
            </option>
          ))}
        </select>

        {selectedCourse && (
          <div className="mt-3 grid gap-2">
            <input className="border rounded-xl px-3 py-2" value={editCourseTitle} onChange={(e) => setEditCourseTitle(e.target.value)} placeholder="Title" />
            <input className="border rounded-xl px-3 py-2" value={editCourseSubject} onChange={(e) => setEditCourseSubject(e.target.value)} placeholder="Subject" />

            <button
              disabled={!adminPass}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
              onClick={async () => {
                setMsg("...");
                try {
                  await adminPost(adminPass, "update_course", {
                    course_id: selectedCourse.id,
                    title: editCourseTitle,
                    subject: editCourseSubject,
                  });
                  setMsg("تم تعديل الكورس ✅");
                  await refreshAll();
                } catch (e: any) {
                  setMsg(e.message);
                }
              }}
            >
              حفظ تعديل الكورس
            </button>

            <button
              type="button"
              disabled={!adminPass}
              className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50"
              onClick={async () => {
                if (!confirm("حذف الكورس بالكامل؟ سيتم حذف كل الوحدات والدروس والأسئلة.")) return;
                setMsg("...");
                try {
                  await adminPost(adminPass, "delete_course", { course_id: selectedCourse.id });
                  setMsg("تم حذف الكورس ✅");
                  setSelectedCourseId("");
                  setSelectedUnitId("");
                  setSelectedLessonId("");
                  setQuestions([]);
                  await refreshAll();
                } catch (e: any) {
                  setMsg(e.message);
                }
              }}
            >
              حذف الكورس بالكامل
            </button>
          </div>
        )}
      </section>

      {/* Term book */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">3) كتاب الترم (PDF) — للصفوف فقط</h2>

        <div className="mt-3 grid gap-2">
          <select className="border rounded-xl px-3 py-2" value={term} onChange={(e) => setTerm(Number(e.target.value) as Term)}>
            <option value={1}>الترم الأول</option>
            <option value={2}>الترم الثاني</option>
          </select>

          <input className="border rounded-xl px-3 py-2" placeholder="PDF URL" value={termBookUrl} onChange={(e) => setTermBookUrl(e.target.value)} />

          <button
            disabled={!adminPass || !selectedCourseId}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            onClick={async () => {
              setMsg("...");
              try {
                await adminPost(adminPass, "set_term_book", { course_id: selectedCourseId, term, book_pdf_url: termBookUrl });
                setMsg("تم حفظ كتاب الترم ✅");
                setTermBookUrl("");
                await refreshAll();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            حفظ
          </button>
        </div>
      </section>

      {/* Units */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">4) الوحدات (Units): إضافة + ترتيب ↑↓ + تعديل</h2>

        <div className="mt-3 grid gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select className="border rounded-xl px-3 py-2" value={unitTerm} onChange={(e) => setUnitTerm(Number(e.target.value) as Term)}>
              <option value={1}>ترم 1</option>
              <option value={2}>ترم 2</option>
            </select>
            <input className="border rounded-xl px-3 py-2" type="number" value={unitOrder} onChange={(e) => setUnitOrder(Number(e.target.value))} placeholder="order" />
            <input className="border rounded-xl px-3 py-2" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} placeholder="عنوان الوحدة" />
          </div>

          <button
            disabled={!adminPass || !selectedCourseId || !unitTitle}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            onClick={async () => {
              setMsg("...");
              try {
                await adminPost(adminPass, "create_unit", { course_id: selectedCourseId, term: unitTerm, order: unitOrder, title: unitTitle });
                setMsg("تم إضافة الوحدة ✅");
                setUnitTitle("");
                await refreshAll();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            إضافة وحدة
          </button>

          <div className="mt-3 text-sm font-semibold">الوحدات:</div>

          <div className="space-y-2">
            {unitsOfCourse.map((u) => (
              <div key={u.id} className={"rounded-xl border p-2 flex items-center justify-between gap-2 " + (selectedUnitId === u.id ? "border-slate-900" : "border-slate-200")}>
                <button
                  type="button"
                  className="text-right flex-1"
                  onClick={() => {
                    setSelectedUnitId(u.id);
                    setSelectedLessonId("");
                    setQuestions([]);
                  }}
                >
                  <div className="font-semibold">
                    (ترم {u.term}) {u.order}) {u.title}
                  </div>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!adminPass}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      setMsg("...");
                      try {
                        await adminPost(adminPass, "move_unit", { unit_id: u.id, direction: -1 });
                        await refreshAll();
                        setMsg("تم ✅");
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    disabled={!adminPass}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      setMsg("...");
                      try {
                        await adminPost(adminPass, "move_unit", { unit_id: u.id, direction: 1 });
                        await refreshAll();
                        setMsg("تم ✅");
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    disabled={!adminPass}
                    className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                    onClick={async () => {
                      if (!confirm("حذف الوحدة؟ سيتم حذف الدروس والأسئلة التابعة لها.")) return;
                      setMsg("...");
                      try {
                        await adminPost(adminPass, "delete_unit", { unit_id: u.id });
                        if (selectedUnitId === u.id) setSelectedUnitId("");
                        await refreshAll();
                        setMsg("تم حذف الوحدة ✅");
                      } catch (e: any) {
                        setMsg(e.message);
                      }
                    }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedUnit && (
            <div className="mt-4 rounded-2xl border p-3">
              <div className="font-bold">تعديل الوحدة المختارة</div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select className="border rounded-xl px-3 py-2" value={editUnitTerm} onChange={(e) => setEditUnitTerm(Number(e.target.value) as Term)}>
                  <option value={1}>ترم 1</option>
                  <option value={2}>ترم 2</option>
                </select>
                <input className="border rounded-xl px-3 py-2" type="number" value={editUnitOrder} onChange={(e) => setEditUnitOrder(Number(e.target.value))} />
                <input className="border rounded-xl px-3 py-2" value={editUnitTitle} onChange={(e) => setEditUnitTitle(e.target.value)} />
              </div>

              <button
                disabled={!adminPass}
                className="mt-2 rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
                onClick={async () => {
                  setMsg("...");
                  try {
                    await adminPost(adminPass, "update_unit", {
                      unit_id: selectedUnit.id,
                      title: editUnitTitle,
                      term: editUnitTerm,
                      order: editUnitOrder,
                    });
                    setMsg("تم تعديل الوحدة ✅");
                    await refreshAll();
                  } catch (e: any) {
                    setMsg(e.message);
                  }
                }}
              >
                حفظ تعديل الوحدة
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lessons */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">5) الدروس (Lessons): إضافة + ترتيب ↑↓ + تعديل</h2>

        {!selectedUnitId ? (
          <div className="mt-2 text-slate-600">اختر وحدة أولًا.</div>
        ) : (
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="border rounded-xl px-3 py-2" type="number" value={lessonOrder} onChange={(e) => setLessonOrder(Number(e.target.value))} placeholder="order" />
              <input className="border rounded-xl px-3 py-2" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="عنوان الدرس" />
            </div>

            <input className="border rounded-xl px-3 py-2" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="YouTube ID فقط" />
            <textarea className="border rounded-xl px-3 py-2" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="ملخص" />
            <textarea className="border rounded-xl px-3 py-2" value={keyPointsText} onChange={(e) => setKeyPointsText(e.target.value)} placeholder="نقاط مهمة (كل سطر نقطة)" />

            <button
              disabled={!adminPass || !lessonTitle}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
              onClick={async () => {
                setMsg("...");
                try {
                  const key_points = keyPointsText.split("\n").map((s) => s.trim()).filter(Boolean);

                  await adminPost(adminPass, "create_lesson", {
                    unit_id: selectedUnitId,
                    order: lessonOrder,
                    title: lessonTitle,
                    youtube_id: youtubeId,
                    summary,
                    key_points,
                  });

                  setMsg("تم إضافة الدرس ✅");
                  setLessonTitle("");
                  setYoutubeId("");
                  setSummary("");
                  setKeyPointsText("");
                  await refreshAll();
                } catch (e: any) {
                  setMsg(e.message);
                }
              }}
            >
              إضافة درس
            </button>

            <div className="mt-3 text-sm font-semibold">الدروس:</div>

            <div className="space-y-2">
              {lessonsOfUnit.map((l) => (
                <div key={l.id} className={"rounded-xl border p-2 flex items-center justify-between gap-2 " + (selectedLessonId === l.id ? "border-slate-900" : "border-slate-200")}>
                  <button type="button" className="text-right flex-1" onClick={() => setSelectedLessonId(l.id)}>
                    <div className="font-semibold">{l.order}) {l.title}</div>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!adminPass}
                      className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                      onClick={async () => {
                        setMsg("...");
                        try {
                          await adminPost(adminPass, "move_lesson", { lesson_id: l.id, direction: -1 });
                          await refreshAll();
                          setMsg("تم ✅");
                        } catch (e: any) {
                          setMsg(e.message);
                        }
                      }}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      disabled={!adminPass}
                      className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                      onClick={async () => {
                        setMsg("...");
                        try {
                          await adminPost(adminPass, "move_lesson", { lesson_id: l.id, direction: 1 });
                          await refreshAll();
                          setMsg("تم ✅");
                        } catch (e: any) {
                          setMsg(e.message);
                        }
                      }}
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      disabled={!adminPass}
                      className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                      onClick={async () => {
                        if (!confirm("حذف الدرس؟ سيتم حذف أسئلته.")) return;
                        setMsg("...");
                        try {
                          await adminPost(adminPass, "delete_lesson", { lesson_id: l.id });
                          if (selectedLessonId === l.id) setSelectedLessonId("");
                          await refreshAll();
                          setMsg("تم حذف الدرس ✅");
                        } catch (e: any) {
                          setMsg(e.message);
                        }
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedLesson && (
              <div className="mt-4 rounded-2xl border p-3">
                <div className="font-bold">تعديل الدرس المختار</div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="border rounded-xl px-3 py-2" type="number" value={editLessonOrder} onChange={(e) => setEditLessonOrder(Number(e.target.value))} />
                  <input className="border rounded-xl px-3 py-2" value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} />
                </div>

                <input className="mt-2 border rounded-xl px-3 py-2" value={editYoutubeId} onChange={(e) => setEditYoutubeId(e.target.value)} placeholder="YouTube ID" />
                <textarea className="mt-2 border rounded-xl px-3 py-2" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} placeholder="ملخص" />
                <textarea className="mt-2 border rounded-xl px-3 py-2" value={editKeyPointsText} onChange={(e) => setEditKeyPointsText(e.target.value)} placeholder="نقاط مهمة (كل سطر نقطة)" />

                <button
                  disabled={!adminPass}
                  className="mt-2 rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
                  onClick={async () => {
                    setMsg("...");
                    try {
                      const key_points = editKeyPointsText.split("\n").map((s) => s.trim()).filter(Boolean);

                      await adminPost(adminPass, "update_lesson", {
                        lesson_id: selectedLesson.id,
                        order: editLessonOrder,
                        title: editLessonTitle,
                        youtube_id: editYoutubeId,
                        summary: editSummary,
                        key_points,
                      });

                      setMsg("تم تعديل الدرس ✅");
                      await refreshAll();
                    } catch (e: any) {
                      setMsg(e.message);
                    }
                  }}
                >
                  حفظ تعديل الدرس
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Quiz */}
      <section className="mt-6 rounded-2xl bg-white border p-4">
        <h2 className="font-bold">6) الأسئلة (Quiz): إضافة + حذف</h2>

        {!selectedLessonId ? (
          <div className="mt-2 text-slate-600">اختر درس أولًا.</div>
        ) : (
          <div className="mt-3 grid gap-2">
            <select className="border rounded-xl px-3 py-2" value={qType} onChange={(e) => setQType(e.target.value as any)}>
              <option value="mcq">اختيار من متعدد</option>
              <option value="tf">صح / غلط</option>
            </select>

            <input className="border rounded-xl px-3 py-2" type="number" value={qOrder} onChange={(e) => setQOrder(Number(e.target.value))} placeholder="ترتيب السؤال" />
            <textarea className="border rounded-xl px-3 py-2" value={qText} onChange={(e) => setQText(e.target.value)} placeholder="نص السؤال" />

            {qType === "mcq" ? (
              <>
                <textarea className="border rounded-xl px-3 py-2" value={choicesText} onChange={(e) => setChoicesText(e.target.value)} placeholder="الاختيارات (كل سطر اختيار)" />
                <input className="border rounded-xl px-3 py-2" type="number" value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))} placeholder="الإجابة الصحيحة (0 = أول اختيار)" />
              </>
            ) : (
              <select className="border rounded-xl px-3 py-2" value={String(correctBool)} onChange={(e) => setCorrectBool(e.target.value === "true")}>
                <option value="true">صح</option>
                <option value="false">غلط</option>
              </select>
            )}

            <textarea className="border rounded-xl px-3 py-2" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="شرح (اختياري)" />

            <button
              disabled={!adminPass || !qText}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
              onClick={async () => {
                setMsg("...");
                try {
                  const choices = choicesText.split("\n").map((s) => s.trim()).filter(Boolean);

                  if (qType === "mcq" && choices.length < 2) throw new Error("لازم على الأقل اختيارين في سؤال MCQ.");
                  if (qType === "mcq" && (correctIndex < 0 || correctIndex >= choices.length)) {
                    throw new Error("correctIndex لازم يكون داخل عدد الاختيارات.");
                  }

                  await adminPost(adminPass, "create_question", {
                    lesson_id: selectedLessonId,
                    qtype: qType,
                    question: qText,
                    choices: qType === "mcq" ? choices : null,
                    correct_index: qType === "mcq" ? correctIndex : null,
                    correct_bool: qType === "tf" ? correctBool : null,
                    explanation,
                    order_index: qOrder,
                  });

                  setMsg("تم إضافة السؤال ✅");
                  setQText("");
                  setChoicesText("");
                  setExplanation("");

                  await refreshQuestions(selectedLessonId);
                } catch (e: any) {
                  setMsg(e.message);
                }
              }}
            >
              إضافة سؤال
            </button>

            <div className="mt-3 rounded-2xl border p-3">
              <div className="font-bold mb-2">أسئلة الدرس</div>

              {questions.length === 0 ? (
                <div className="text-sm text-slate-600">لا يوجد أسئلة بعد.</div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q) => (
                    <div key={q.id} className="rounded-xl border p-2 flex items-start justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-semibold">
                          ({q.order_index}) [{q.qtype}] {q.question}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!adminPass}
                        className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                        onClick={async () => {
                          if (!confirm("حذف السؤال؟")) return;
                          setMsg("...");
                          try {
                            await adminPost(adminPass, "delete_question", { question_id: q.id });
                            setMsg("تم حذف السؤال ✅");
                            await refreshQuestions(selectedLessonId);
                          } catch (e: any) {
                            setMsg(e.message);
                          }
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}