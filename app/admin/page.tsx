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
  course_terms?: { id: string; term: Term; book_pdf_url: string | null }[];
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
      attachment_url?: string | null;
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

async function adminPost(action: string, payload: any) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "فشل الطلب");
  return json.data;
}

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"grades" | "tracks">("grades");

  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [msg, setMsg] = useState<string>("");

  // Forms - Grades
  const [gSlug, setGSlug] = useState("");
  const [gName, setGName] = useState("");
  const [gOrder, setGOrder] = useState<number>(1);

  // Forms - Tracks
  const [tSlug, setTSlug] = useState("");
  const [tName, setTName] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tOrder, setTOrder] = useState<number>(1);

  // Forms - Courses
  const [courseGradeSlug, setCourseGradeSlug] = useState<string>("");
  const [courseTrackSlug, setCourseTrackSlug] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseSubject, setCourseSubject] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseSubject, setEditCourseSubject] = useState("");

  // Forms - Term Books
  const [term, setTerm] = useState<Term>(1);
  const [termBookUrl, setTermBookUrl] = useState("");

  // Forms - Units
  const [unitTerm, setUnitTerm] = useState<Term>(1);
  const [unitOrder, setUnitOrder] = useState<number>(1);
  const [unitTitle, setUnitTitle] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [editUnitTitle, setEditUnitTitle] = useState("");
  const [editUnitOrder, setEditUnitOrder] = useState<number>(1);
  const [editUnitTerm, setEditUnitTerm] = useState<Term>(1);

  // Forms - Lessons
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [lessonTitle, setLessonTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [editLessonOrder, setEditLessonOrder] = useState<number>(1);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editYoutubeId, setEditYoutubeId] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editKeyPointsText, setEditKeyPointsText] = useState("");
  const [editAttachmentUrl, setEditAttachmentUrl] = useState("");

  // Forms - Questions
  const [qType, setQType] = useState<"mcq" | "tf">("mcq");
  const [qOrder, setQOrder] = useState<number>(1);
  const [qText, setQText] = useState("");
  const [choicesText, setChoicesText] = useState("");
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [correctBool, setCorrectBool] = useState<boolean>(true);
  const [explanation, setExplanation] = useState("");

  // Question editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const availableCourses = useMemo(() => {
    return courses.filter((c) =>
      adminTab === "grades" ? c.course_type === "grade" : c.course_type === "track"
    );
  }, [courses, adminTab]);

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
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    })();
    refreshAll();
  }, []);

  const handleTabChange = (newTab: "grades" | "tracks") => {
    setAdminTab(newTab);
    setSelectedCourseId("");
    setSelectedUnitId("");
    setSelectedLessonId("");
    setQuestions([]);
    setMsg("");
    setTermBookUrl("");
  };

  useEffect(() => {
    if (selectedCourse) {
      setEditCourseTitle(selectedCourse.title ?? "");
      setEditCourseSubject(selectedCourse.subject ?? "");
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedUnit) {
      setEditUnitTitle(selectedUnit.title ?? "");
      setEditUnitOrder(selectedUnit.order ?? 1);
      setEditUnitTerm(selectedUnit.term ?? 1);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    setQuestions([]);
    setEditingQuestionId(null);
    if (selectedLesson) {
      setEditLessonTitle(selectedLesson.title ?? "");
      setEditLessonOrder(selectedLesson.order ?? 1);
      setEditYoutubeId(selectedLesson.youtube_id ?? "");
      setEditSummary(selectedLesson.summary ?? "");
      setEditKeyPointsText((selectedLesson.key_points ?? []).join("\n"));
      setEditAttachmentUrl(selectedLesson.attachment_url ?? "");
    }
    if (selectedLessonId) refreshQuestions(selectedLessonId);
  }, [selectedLessonId]);

  const startEditQuestion = (q: QuestionRow) => {
    setEditingQuestionId(q.id);
    setQType(q.qtype);
    setQOrder(q.order_index);
    setQText(q.question);
    setChoicesText((q.choices ?? []).join("\n"));
    setCorrectIndex(q.correct_index ?? 0);
    setCorrectBool(q.correct_bool ?? true);
    setExplanation(q.explanation ?? "");
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setQText("");
    setChoicesText("");
    setExplanation("");
  };

  return (
    <main className="mx-auto max-w-5xl p-4 dir-rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold">لوحة إدارة منصة مِسك</h1>
          <p className="text-sm text-slate-600">أهلاً بك، {userEmail ?? "جاري التحقق..."}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-xl font-bold">
          حساب أدمن موثق ✅
        </span>
      </div>

      {msg && <p className="mt-4 p-3 rounded-xl bg-slate-900 text-white text-sm font-semibold">{msg}</p>}

      {/* Main Mode Tabs */}
      <div className="mt-6 flex bg-slate-200 p-1.5 rounded-2xl gap-2">
        <button
          onClick={() => handleTabChange("grades")}
          className={`flex-1 py-3 font-bold rounded-xl text-center transition ${
            adminTab === "grades" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🎓 المناهج والصفوف المدرسية
        </button>
        <button
          onClick={() => handleTabChange("tracks")}
          className={`flex-1 py-3 font-bold rounded-xl text-center transition ${
            adminTab === "tracks" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          💻 الكورسات العامة والمسارات
        </button>
      </div>

      {/* SCHOOL GRADES */}
      {adminTab === "grades" && (
        <div className="space-y-6 mt-4">
          <section className="rounded-2xl bg-white border p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-2">1) إضافة أو تعديل مرحلة / صف دراسي</h2>
            <div className="grid gap-2">
              <input className="border rounded-xl px-3 py-2" placeholder="الكود (slug) مثال: sec3" value={gSlug} onChange={(e) => setGSlug(e.target.value.trim())} />
              <input className="border rounded-xl px-3 py-2" placeholder="اسم الصف (مثال: الصف الثالث الثانوي)" value={gName} onChange={(e) => setGName(e.target.value)} />
              <button
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold"
                onClick={async () => {
                  setMsg("جاري الحفظ...");
                  try {
                    if (!gSlug || !gName) throw new Error("يرجى ملء كافة البيانات");
                    await adminPost("upsert_grade", { slug: gSlug, name: gName, order_index: gOrder });
                    setMsg("تم حفظ الصف بنجاح ✅"); setGSlug(""); setGName(""); await refreshAll();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                حفظ / تعديل الصف
              </button>

              <div className="text-sm font-semibold mt-3">الصفوف المتاحة:</div>
              <ul className="text-sm space-y-2">
                {grades.map((g) => (
                  <li key={g.slug} className="border rounded-xl p-2 flex justify-between items-center">
                    <span>{g.order_index}) {g.name} — <span className="font-mono text-slate-500">{g.slug}</span></span>
                    <div className="flex gap-2">
                      <button className="rounded-lg border px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200" onClick={() => { setGSlug(g.slug); setGName(g.name); setGOrder(g.order_index); }}>تعديل ✏️</button>
                      <button className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50" onClick={async () => {
                        if (!confirm("حذف هذا الصف؟")) return;
                        setMsg("جاري الحذف...");
                        try { await adminPost("delete_grade", { slug: g.slug }); setMsg("تم الحذف ✅"); await refreshAll(); } catch (e: any) { setMsg(e.message); }
                      }}>حذف</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl bg-white border p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-2">2) إضافة مادة للصف الدراسي</h2>
            <div className="grid gap-2">
              <select className="border rounded-xl px-3 py-2 font-semibold" value={courseGradeSlug} onChange={(e) => setCourseGradeSlug(e.target.value)}>
                <option value="">-- اختر الصف الدراسي --</option>
                {grades.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
              <input className="border rounded-xl px-3 py-2" placeholder="المادة (مثال: البرمجة وعلوم الحاسب)" value={courseSubject} onChange={(e) => setCourseSubject(e.target.value)} />

              <button
                disabled={!courseGradeSlug || !courseSubject}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
                onClick={async () => {
                  setMsg("جاري الإنشاء...");
                  try {
                    const data = await adminPost("create_course", { course_type: "grade", grade_slug: courseGradeSlug, title: courseSubject, subject: courseSubject });
                    setMsg("تم إنشاء المادة بنجاح ✅"); setSelectedCourseId(data.id); setCourseSubject(""); await refreshAll();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                إنشاء المادة
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white border p-4 shadow-sm bg-blue-50">
            <h2 className="font-bold text-lg mb-2 text-blue-900">3) 📄 كتاب المادة (PDF) للترم</h2>
            <div className="grid gap-2">
              <select className="border rounded-xl px-3 py-2 font-semibold" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                <option value="">-- اختر المادة / الكورس المدرسي --</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>صف: {gradeName(c.grade)} | {c.subject}</option>
                ))}
              </select>

              {selectedCourseId && (
                <>
                  <select className="border rounded-xl px-3 py-2" value={term} onChange={(e) => setTerm(Number(e.target.value) as Term)}>
                    <option value={1}>الترم الأول</option>
                    <option value={2}>الترم الثاني</option>
                  </select>
                  <input className="border rounded-xl px-3 py-2" placeholder="رابط الـ PDF" value={termBookUrl} onChange={(e) => setTermBookUrl(e.target.value)} />
                  <button
                    className="rounded-xl bg-blue-700 text-white px-4 py-2 font-semibold hover:bg-blue-800"
                    onClick={async () => {
                      setMsg("جاري الحفظ...");
                      try {
                        await adminPost("set_term_book", { course_id: selectedCourseId, term, book_pdf_url: termBookUrl });
                        setMsg("تم حفظ كتاب الترم ✅"); setTermBookUrl(""); await refreshAll();
                      } catch (e: any) { setMsg(e.message); }
                    }}
                  >
                    حفظ كتاب الترم
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {/* GENERAL TRACKS */}
      {adminTab === "tracks" && (
        <div className="space-y-6 mt-4">
          <section className="rounded-2xl bg-white border p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-2">1) إضافة أو تعديل مسار / كورس عام (مثل ICDL أو Excel)</h2>
            <div className="grid gap-2">
              <input className="border rounded-xl px-3 py-2" placeholder="الكود (slug) مثال: icdl" value={tSlug} onChange={(e) => setTSlug(e.target.value.trim())} />
              <input className="border rounded-xl px-3 py-2" placeholder="اسم الكورس / المسار (مثال: ICDL)" value={tName} onChange={(e) => setTName(e.target.value)} />
              <textarea className="border rounded-xl px-3 py-2" placeholder="وصف الكورس (اختياري)" value={tDesc} onChange={(e) => setTDesc(e.target.value)} />

              <button
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold"
                onClick={async () => {
                  setMsg("جاري الحفظ...");
                  try {
                    if (!tSlug || !tName) throw new Error("يرجى ملء الكود والاسم");
                    await adminPost("upsert_track", { slug: tSlug, name: tName, description: tDesc, order_index: tOrder });
                    setMsg("تم حفظ الكورس العام بنجاح ✅"); setTSlug(""); setTName(""); setTDesc(""); await refreshAll();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                حفظ / تعديل الكورس العام
              </button>

              <div className="text-sm font-semibold mt-3">الكورسات المتاحة:</div>
              <ul className="text-sm space-y-2">
                {tracks.map((t) => (
                  <li key={t.slug} className="border rounded-xl p-2 flex justify-between items-center">
                    <span>{t.order_index}) {t.name} — <span className="font-mono text-slate-500">{t.slug}</span></span>
                    <div className="flex gap-2">
                      <button className="rounded-lg border px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200" onClick={() => { setTSlug(t.slug); setTName(t.name); setTDesc(t.description ?? ""); setTOrder(t.order_index); }}>تعديل ✏️</button>
                      <button className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50" onClick={async () => {
                        if (!confirm("حذف هذا المسار؟")) return;
                        setMsg("جاري الحذف...");
                        try { await adminPost("delete_track", { slug: t.slug }); setMsg("تم الحذف ✅"); await refreshAll(); } catch (e: any) { setMsg(e.message); }
                      }}>حذف</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl bg-white border p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-2">2) تفعيل الكورس العام للعرض بالموقع</h2>
            <div className="grid gap-2">
              <select className="border rounded-xl px-3 py-2 font-semibold" value={courseTrackSlug} onChange={(e) => setCourseTrackSlug(e.target.value)}>
                <option value="">-- اختر الكورس العام --</option>
                {tracks.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
              </select>
              <input className="border rounded-xl px-3 py-2" placeholder="اسم الكورس المالي أو التفصيلي" value={courseSubject} onChange={(e) => setCourseSubject(e.target.value)} />

              <button
                disabled={!courseTrackSlug || !courseSubject}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
                onClick={async () => {
                  setMsg("جاري التفعيل...");
                  try {
                    const data = await adminPost("create_course", { course_type: "track", track_slug: courseTrackSlug, title: courseSubject, subject: courseSubject });
                    setMsg("تم تفعيل الكورس بنجاح ✅"); setSelectedCourseId(data.id); setCourseSubject(""); await refreshAll();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                تفعيل الكورس
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white border p-4 shadow-sm bg-blue-50">
            <h2 className="font-bold text-lg mb-2 text-blue-900">3) 📄 مذكرة / ملف الكورس العام (PDF)</h2>
            <div className="grid gap-2">
              <select className="border rounded-xl px-3 py-2 font-semibold" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                <option value="">-- اختر الكورس العام --</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>مسار: {c.track_slug} | {c.subject}</option>
                ))}
              </select>

              {selectedCourseId && (
                <>
                  <input className="border rounded-xl px-3 py-2" placeholder="رابط الـ PDF أو الملف المرفق" value={termBookUrl} onChange={(e) => setTermBookUrl(e.target.value)} />
                  <button
                    className="rounded-xl bg-blue-700 text-white px-4 py-2 font-semibold hover:bg-blue-800"
                    onClick={async () => {
                      setMsg("جاري الحفظ...");
                      try {
                        await adminPost("set_term_book", { course_id: selectedCourseId, term: 1, book_pdf_url: termBookUrl });
                        setMsg("تم حفظ مذكرة الكورس ✅"); setTermBookUrl(""); await refreshAll();
                      } catch (e: any) { setMsg(e.message); }
                    }}
                  >
                    حفظ ملف الكورس
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {/* CONTENT MANAGEMENT SECTION */}
      <div className="mt-8 border-t border-slate-300 pt-6 space-y-6">
        <h2 className="text-xl font-extrabold text-slate-800">
          ⚙️ إدارة محتوى الوحدات والدروس والأسئلة
        </h2>

        {/* Course Selection and Edit */}
        <section className="rounded-2xl bg-white border p-4 shadow-sm">
          <h3 className="font-bold text-md mb-2">اختر كورس للعمل على تعديله أو إضافة وحداته:</h3>
          <select
            className="w-full border rounded-xl px-3 py-2 font-bold text-slate-800"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedUnitId(""); setSelectedLessonId(""); setQuestions([]);
            }}
          >
            <option value="">-- اختر الكورس من القائمة --</option>
            {availableCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_type === "track" ? `كورس عام: ${c.title} | ${c.subject}` : `صف مدرسي: ${gradeName(c.grade)} | ${c.subject}`}
              </option>
            ))}
          </select>

          {selectedCourse && (
            <div className="mt-4 p-3 bg-slate-50 border rounded-xl space-y-3">
              <div className="font-bold text-sm text-slate-700">تعديل اسم/مادة الكورس المختار ✏️</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className="border rounded-xl px-3 py-2 bg-white" value={editCourseTitle} onChange={(e) => setEditCourseTitle(e.target.value)} placeholder="العنوان" />
                <input className="border rounded-xl px-3 py-2 bg-white" value={editCourseSubject} onChange={(e) => setEditCourseSubject(e.target.value)} placeholder="المادة / التخصص" />
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                  onClick={async () => {
                    setMsg("جاري التعديل...");
                    try {
                      await adminPost("update_course", { course_id: selectedCourse.id, title: editCourseTitle, subject: editCourseSubject });
                      setMsg("تم تعديل الكورس بنجاح ✅"); await refreshAll();
                    } catch (e: any) { setMsg(e.message); }
                  }}
                >
                  حفظ تعديل الكورس
                </button>
                <button
                  className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700"
                  onClick={async () => {
                    if (!confirm("حذف الكورس بجميع وحداته ودروسه؟")) return;
                    setMsg("جاري الحذف...");
                    try {
                      await adminPost("delete_course", { course_id: selectedCourseId });
                      setMsg("تم الحذف بنجاح ✅"); setSelectedCourseId(""); await refreshAll();
                    } catch (e: any) { setMsg(e.message); }
                  }}
                >
                  حذف الكورس
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Units */}
        <section className="rounded-2xl bg-white border p-4 shadow-sm">
          <h3 className="font-bold text-md mb-2">1) الوحدات (Units)</h3>
          {!selectedCourseId ? (
            <p className="text-sm text-slate-500">اختر كورس أولاً من الخانة أعلاه.</p>
          ) : (
            <div className="grid gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedCourse?.course_type === "grade" && (
                  <select className="border rounded-xl px-3 py-2" value={unitTerm} onChange={(e) => setUnitTerm(Number(e.target.value) as Term)}>
                    <option value={1}>ترم 1</option>
                    <option value={2}>ترم 2</option>
                  </select>
                )}
                <input className="border rounded-xl px-3 py-2" type="number" value={unitOrder} onChange={(e) => setUnitOrder(Number(e.target.value))} placeholder="ترتيب الوحدة" />
                <input className="border rounded-xl px-3 py-2" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} placeholder="عنوان الوحدة الجديدة" />
              </div>

              <button
                disabled={!unitTitle}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
                onClick={async () => {
                  setMsg("جاري إضافة الوحدة...");
                  try {
                    await adminPost("create_unit", { course_id: selectedCourseId, term: selectedCourse?.course_type === "track" ? 1 : unitTerm, order: unitOrder, title: unitTitle });
                    setMsg("تمت الإضافة ✅"); setUnitTitle(""); await refreshAll();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                إضافة وحدة
              </button>

              <div className="mt-3 font-semibold text-sm">الوحدات الحالية:</div>
              <div className="space-y-2">
                {unitsOfCourse.map((u) => (
                  <div key={u.id} className={`rounded-xl border p-2 flex items-center justify-between gap-2 ${selectedUnitId === u.id ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                    <button type="button" className="text-right flex-1" onClick={() => { setSelectedUnitId(u.id); setSelectedLessonId(""); setQuestions([]); }}>
                      <span className="font-bold">{selectedCourse?.course_type === "grade" ? `(ترم ${u.term}) ` : ""}#{u.order} — {u.title}</span>
                    </button>
                    <div className="flex gap-1">
                      <button className="border rounded-lg px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200" onClick={() => setSelectedUnitId(u.id)}>تعديل ✏️</button>
                      <button className="border rounded-lg px-2 py-1 text-xs" onClick={async () => { await adminPost("move_unit", { unit_id: u.id, direction: -1 }); await refreshAll(); }}>↑</button>
                      <button className="border rounded-lg px-2 py-1 text-xs" onClick={async () => { await adminPost("move_unit", { unit_id: u.id, direction: 1 }); await refreshAll(); }}>↓</button>
                      <button className="bg-red-600 text-white rounded-lg px-2 py-1 text-xs" onClick={async () => { if (confirm("حذف الوحدة؟")) { await adminPost("delete_unit", { unit_id: u.id }); await refreshAll(); } }}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedUnit && (
                <div className="mt-4 rounded-2xl border p-3 bg-slate-50 space-y-2">
                  <div className="font-bold text-sm text-slate-700">تعديل الوحدة المختارة: {selectedUnit.title} ✏️</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedCourse?.course_type === "grade" && (
                      <select className="border rounded-xl px-3 py-2 bg-white" value={editUnitTerm} onChange={(e) => setEditUnitTerm(Number(e.target.value) as Term)}>
                        <option value={1}>ترم 1</option>
                        <option value={2}>ترم 2</option>
                      </select>
                    )}
                    <input className="border rounded-xl px-3 py-2 bg-white" type="number" value={editUnitOrder} onChange={(e) => setEditUnitOrder(Number(e.target.value))} placeholder="الترتيب" />
                    <input className="border rounded-xl px-3 py-2 bg-white" value={editUnitTitle} onChange={(e) => setEditUnitTitle(e.target.value)} placeholder="العنوان" />
                  </div>
                  <button
                    className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                    onClick={async () => {
                      setMsg("جاري التعديل...");
                      try {
                        await adminPost("update_unit", { unit_id: selectedUnit.id, title: editUnitTitle, term: editUnitTerm, order: editUnitOrder });
                        setMsg("تم تعديل الوحدة بنجاح ✅"); await refreshAll();
                      } catch (e: any) { setMsg(e.message); }
                    }}
                  >
                    حفظ تعديل الوحدة
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Lessons */}
        <section className="rounded-2xl bg-white border p-4 shadow-sm">
          <h3 className="font-bold text-md mb-2">2) الدروس (Lessons)</h3>
          {!selectedUnitId ? (
            <p className="text-sm text-slate-500">اختر وحدة أولاً من الأعلى.</p>
          ) : (
            <div className="grid gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className="border rounded-xl px-3 py-2" type="number" value={lessonOrder} onChange={(e) => setLessonOrder(Number(e.target.value))} placeholder="ترتيب الدرس" />
                <input className="border rounded-xl px-3 py-2" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="عنوان الدرس الجديد" />
              </div>
              <input className="border rounded-xl px-3 py-2" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="معرّف يوتيوب (ID) فقط" />
              <input className="border rounded-xl px-3 py-2" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="رابط ملحقات الدرس (PDF/Drive)" />
              <textarea className="border rounded-xl px-3 py-2" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="ملخص الدرس" />
              <textarea className="border rounded-xl px-3 py-2" value={keyPointsText} onChange={(e) => setKeyPointsText(e.target.value)} placeholder="نقاط مهمة (كل سطر نقطة)" />

              <button
                disabled={!lessonTitle}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
                onClick={async () => {
                  setMsg("جاري الإضافة...");
                  try {
                    const key_points = keyPointsText.split("\n").map((s) => s.trim()).filter(Boolean);
                    await adminPost("create_lesson", { unit_id: selectedUnitId, order: lessonOrder, title: lessonTitle, youtube_id: youtubeId, summary, key_points, attachment_url: attachmentUrl });
                    setMsg("تم الإضافة ✅"); setLessonTitle(""); setYoutubeId(""); setSummary(""); setKeyPointsText(""); setAttachmentUrl(""); await refreshAll();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                إضافة درس
              </button>

              <div className="mt-3 font-semibold text-sm">دروس الوحدة:</div>
              <div className="space-y-2">
                {lessonsOfUnit.map((l) => (
                  <div key={l.id} className={`rounded-xl border p-2 flex items-center justify-between gap-2 ${selectedLessonId === l.id ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                    <button type="button" className="text-right flex-1" onClick={() => setSelectedLessonId(l.id)}>
                      <span className="font-bold">#{l.order} — {l.title}</span>
                      {l.attachment_url && <span className="text-xs text-blue-600 block">📁 يتضمن مرفق</span>}
                    </button>
                    <div className="flex gap-1">
                      <button className="border rounded-lg px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200" onClick={() => setSelectedLessonId(l.id)}>تعديل ✏️</button>
                      <button className="border rounded-lg px-2 py-1 text-xs" onClick={async () => { await adminPost("move_lesson", { lesson_id: l.id, direction: -1 }); await refreshAll(); }}>↑</button>
                      <button className="border rounded-lg px-2 py-1 text-xs" onClick={async () => { await adminPost("move_lesson", { lesson_id: l.id, direction: 1 }); await refreshAll(); }}>↓</button>
                      <button className="bg-red-600 text-white rounded-lg px-2 py-1 text-xs" onClick={async () => { if (confirm("حذف الدرس؟")) { await adminPost("delete_lesson", { lesson_id: l.id }); await refreshAll(); } }}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedLesson && (
                <div className="mt-4 rounded-2xl border p-3 bg-slate-50 space-y-2">
                  <div className="font-bold text-sm text-slate-700">تعديل الدرس المختار: {selectedLesson.title} ✏️</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className="border rounded-xl px-3 py-2 bg-white" type="number" value={editLessonOrder} onChange={(e) => setEditLessonOrder(Number(e.target.value))} />
                    <input className="border rounded-xl px-3 py-2 bg-white" value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} />
                  </div>
                  <input className="border rounded-xl px-3 py-2 bg-white" value={editYoutubeId} onChange={(e) => setEditYoutubeId(e.target.value)} placeholder="معرّف يوتيوب" />
                  <input className="border rounded-xl px-3 py-2 bg-white" value={editAttachmentUrl} onChange={(e) => setEditAttachmentUrl(e.target.value)} placeholder="رابط الملف المرفق" />
                  <textarea className="border rounded-xl px-3 py-2 bg-white" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} placeholder="الملخص" />
                  <textarea className="border rounded-xl px-3 py-2 bg-white" value={editKeyPointsText} onChange={(e) => setEditKeyPointsText(e.target.value)} placeholder="النقاط (كل سطر نقطة)" />

                  <button
                    className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                    onClick={async () => {
                      setMsg("جاري حفظ التعديل...");
                      try {
                        const key_points = editKeyPointsText.split("\n").map((s) => s.trim()).filter(Boolean);
                        await adminPost("update_lesson", {
                          lesson_id: selectedLesson.id,
                          order: editLessonOrder,
                          title: editLessonTitle,
                          youtube_id: editYoutubeId,
                          summary: editSummary,
                          key_points,
                          attachment_url: editAttachmentUrl,
                        });
                        setMsg("تم حفظ التعديل بنجاح ✅"); await refreshAll();
                      } catch (e: any) { setMsg(e.message); }
                    }}
                  >
                    حفظ تعديل الدرس
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Quizzes */}
        <section className="rounded-2xl bg-white border p-4 shadow-sm">
          <h3 className="font-bold text-md mb-2">3) الاختبارات والأسئلة (Quizzes)</h3>
          {!selectedLessonId ? (
            <p className="text-sm text-slate-500">اختر درساً أولاً من قائمة الدروس اعلاه.</p>
          ) : (
            <div className="grid gap-2">
              <select className="border rounded-xl px-3 py-2 font-semibold" value={qType} onChange={(e) => setQType(e.target.value as any)}>
                <option value="mcq">اختيار من متعدد</option>
                <option value="tf">صح / غلط</option>
              </select>
              <input className="border rounded-xl px-3 py-2" type="number" value={qOrder} onChange={(e) => setQOrder(Number(e.target.value))} placeholder="ترتيب السؤال" />
              <textarea className="border rounded-xl px-3 py-2" value={qText} onChange={(e) => setQText(e.target.value)} placeholder="نص السؤال" />

              {qType === "mcq" ? (
                <>
                  <textarea className="border rounded-xl px-3 py-2" value={choicesText} onChange={(e) => setChoicesText(e.target.value)} placeholder="الاختيارات (كل سطر اختيار)" />
                  <input className="border rounded-xl px-3 py-2" type="number" value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))} placeholder="رقم الإجابة الصحيحة (0 = الاختيار الأول)" />
                </>
              ) : (
                <select className="border rounded-xl px-3 py-2 font-semibold" value={String(correctBool)} onChange={(e) => setCorrectBool(e.target.value === "true")}>
                  <option value="true">صح</option>
                  <option value="false">غلط</option>
                </select>
              )}
              <textarea className="border rounded-xl px-3 py-2" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="شرح الإجابة (اختياري)" />

              <button
                disabled={!qText}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
                onClick={async () => {
                  setMsg("جاري الإضافة/التعديل...");
                  try {
                    const choices = choicesText.split("\n").map((s) => s.trim()).filter(Boolean);
                    
                    // لو بنعدل سؤال موجود
                    if (editingQuestionId) {
                      await adminPost("update_question", {
                        question_id: editingQuestionId,
                        qtype: qType,
                        question: qText,
                        choices: qType === "mcq" ? choices : null,
                        correct_index: qType === "mcq" ? correctIndex : null,
                        correct_bool: qType === "tf" ? correctBool : null,
                        explanation,
                        order_index: qOrder,
                      });
                      setMsg("تم تعديل السؤال بنجاح ✅");
                      cancelEditQuestion();
                    } else {
                      // إضافة سؤال جديد
                      await adminPost("create_question", {
                        lesson_id: selectedLessonId,
                        qtype: qType,
                        question: qText,
                        choices: qType === "mcq" ? choices : null,
                        correct_index: qType === "mcq" ? correctIndex : null,
                        correct_bool: qType === "tf" ? correctBool : null,
                        explanation,
                        order_index: qOrder,
                      });
                      setMsg("تمت إضافة السؤال بنجاح ✅");
                      setQText(""); setChoicesText(""); setExplanation("");
                    }
                    await refreshQuestions(selectedLessonId);
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                {editingQuestionId ? "حفظ تعديل السؤال" : "إضافة سؤال جديد"}
              </button>

              {editingQuestionId && (
                <button className="rounded-xl border px-4 py-1.5 text-sm" onClick={cancelEditQuestion}>
                  إلغاء تعديل السؤال
                </button>
              )}

              <div className="mt-4 font-semibold text-sm">أسئلة هذا الدرس:</div>
              <div className="space-y-2">
                {questions.map((q) => (
                  <div key={q.id} className="border rounded-xl p-2 flex justify-between items-center text-sm">
                    <div>#{q.order_index} [{q.qtype}] {q.question}</div>
                    <div className="flex gap-1">
                      <button className="border rounded-lg px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200" onClick={() => startEditQuestion(q)}>تعديل ✏️</button>
                      <button className="bg-red-600 text-white rounded-lg px-2 py-1 text-xs" onClick={async () => {
                        if (confirm("حذف السؤال؟")) { await adminPost("delete_question", { question_id: q.id }); await refreshQuestions(selectedLessonId); }
                      }}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}