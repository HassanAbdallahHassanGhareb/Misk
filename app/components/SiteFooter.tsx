export default function SiteFooter() {
  const whatsapp = "201095432213"; // عدّل رقمك

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="font-bold">مِسك</div>
          <p className="mt-1 text-sm text-slate-600">
            منصة مجانية لشرح الكمبيوتر والبرمجة والذكاء الاصطناعي بطريقة بسيطة.
          </p>
        </div>

        <div>
          <div className="font-bold">الدعم والتواصل</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300"
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              واتساب الدعم
            </a>

            <a
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300"
              href="mailto:support@misk.com"
            >
              support@misk.com
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-slate-500">
          © {new Date().getFullYear()} مِسك
        </div>
      </div>
    </footer>
  );
}