import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = supabaseServer();

  const { data: course, error } = await supabase
    .from("courses")
    .select(`id, grade, title, subject, units ( id, title, order )`)
    .eq("id", courseId)
    .single();

  if (error || !course) notFound();

  const units = [...(course.units ?? [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← الرجوع للوحة التحكم
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold">{course.subject}</h1>
      <p className="mt-1 text-slate-600">{course.title}</p>

      <h2 className="mt-6 text-lg font-bold">الوحدات</h2>
      <div className="mt-3 grid gap-3">
        {units.map((u: any) => (
          <Link
            key={u.id}
            href={`/course/${course.id}/unit/${u.id}`}
            className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:border-slate-300"
          >
            <div className="font-bold">{u.title}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}