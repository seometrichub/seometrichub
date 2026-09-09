import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    next = "/";
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const safeError =
      error.code ||
      (error.message.toLowerCase().includes("code verifier")
        ? "code_verifier_missing"
        : "exchange_failed");

    console.error("Supabase auth callback exchange failed:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(safeError)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}