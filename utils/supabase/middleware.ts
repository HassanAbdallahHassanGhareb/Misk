import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isAdminEmail(email: string | null | undefined) {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!email) return false;
  return list.includes(email.toLowerCase());
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ✅ طلب Login على الصفحة الرئيسية + محتوى الكورسات + progress APIs
  const needsAuth =
    path === "/" ||
    path.startsWith("/course") ||
    path.startsWith("/api/progress");

  // ✅ حماية الأدمن
  const needsAdmin = path.startsWith("/admin") || path.startsWith("/api/admin");

  // صفحات لازم تفضل متاحة بدون Login
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/api/courses") ||
    path.startsWith("/api/grades") ||
    path.startsWith("/api/tracks") ||
    path === "/favicon.ico";

  // 1) لو مش عامل Login وداخل على صفحة محمية -> روح login
  if (!user && (needsAuth || needsAdmin) && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 2) لو داخل على الأدمن ومش Admin -> امنعه
  if (user && needsAdmin && !isAdminEmail(user.email)) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}