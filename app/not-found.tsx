import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50">
            <span className="text-4xl font-black text-orange-500">404</span>
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Page Not Found
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Looks like this page
            <span className="text-orange-500"> moved off the map.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            The page you are looking for may have been moved, deleted, or the
            URL may be incorrect. You can return to SEOMETRICHUB or start a
            fresh website SEO audit.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              Back to Home
            </Link>

            <Link
              href="/audit"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Start Free SEO Audit
            </Link>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-500">
              Need help?{" "}
              <a
                href="mailto:support@seometrichub.com"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                support@seometrichub.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}