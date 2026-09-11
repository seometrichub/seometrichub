"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isConfirmed = params.get("confirmed") === "true";

    setConfirmed(isConfirmed);

    if (isConfirmed && params.has("code")) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?confirmed=true`
      );
    }
  }, []);

  async function handleGoogleLogin() {
    const supabase = createClient();
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    const supabase = createClient();
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to your SEOMETRICHUB account.
            </p>
          </div>

          {confirmed && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Email confirmed. You can now sign in.
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <span className="text-lg font-black text-[#4285F4]">G</span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase text-slate-400">
              or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#F97316] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-bold text-[#F97316] hover:text-[#EA580C]"
            >
              Create account
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}